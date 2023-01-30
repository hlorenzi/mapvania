import { RefreshToken } from "../util/refreshToken"
import { global } from "../global"
import * as Filesystem from "./filesystem"
import * as ID from "./id"
import * as Dev from "./dev"
import * as Defs from "./defs"
import * as DefsSerialization from "./defs_serialization"
import * as Map from "./map"
import * as MapSerialization from "./map_serialization"
import * as MapEditor from "../mapEditor"


export interface Global
{
    refreshToken: RefreshToken
    editors: Editor[]
    currentEditor: number

    mapEditing:
    {
        layerDefId: ID.ID
    
        tool: Tool
        toolBeforeKeyToggle: Tool
        toolKeyToggled: boolean
    
        tilesetDefId: ID.ID
        tilesetStampSet: Set<number>
        tileStamp: Map.TileField

        tileBrushDefId: ID.ID
        tileBrushEdgeBehavior: "none" | "connectAlways"

        objectDefId: ID.ID
        objectsCopied: Map.Obj[]

        roomsCopied: Map.Room[]

        showGrid: "none" | "background" | "foreground"
        showOtherLayers: "none" | "normal" | "faded"
        syncEditorCameras: boolean
    }
}


export const LAYERDEF_ID_MAP = "world"


export type Tool = "move" | "draw" | "fill" | "erase" | "select"


export type Editor =
    EditorDefs |
    EditorMap


export interface EditorCommon
{
    name: string
    rootPath: string
    basePath: string
}


export interface EditorDefs extends EditorCommon
{
    type: "defs"
    defs: Defs.Defs
    lastSavedDefsSerialized: string
    lastSavedDefs: Defs.Defs

    history: EditorDefsHistoryStep[]
    historyPointer: number
}


export interface EditorDefsHistoryStep
{
    tag: string
    defs: Defs.Defs
}


export interface EditorMap extends EditorCommon
{
    type: "map"
    defs: Defs.Defs
    lastSavedDefsSerialized: string
    defsRootPath: string
    defsBasePath: string
    map: Map.Map
    lastSavedMapSerialized: string
    lastSavedMap: Map.Map
    mapEditor: MapEditor.State

    history: EditorMapHistoryStep[]
    historyPointer: number
}


export interface EditorMapHistoryStep
{
    tag: string
    map: Map.Map
}


export function makeNew(refreshToken: RefreshToken): Global
{
    return {
        refreshToken,
        editors: [],
        currentEditor: -1,

        mapEditing: {
            layerDefId: LAYERDEF_ID_MAP,

            tool: "move",
            toolBeforeKeyToggle: "move",
            toolKeyToggled: false,
        
            tilesetDefId: "",
            tilesetStampSet: new Set<number>(),
            tileStamp: {
                tiles: [],
                width: 0,
                height: 0,
            },

            tileBrushDefId: "",
            tileBrushEdgeBehavior: "none",

            objectDefId: "",
            objectsCopied: [],

            roomsCopied: [],

            showGrid: "background",
            showOtherLayers: "normal",
            syncEditorCameras: false,
        }
    }
}


export function assignEditorDefs(
    editorIndex: number,
    fn: (old: Defs.Defs) => Defs.Defs)
{
    global.editors.editors = [
        ...global.editors.editors.slice(0, editorIndex),
        {
            ...global.editors.editors[editorIndex],
            defs: fn(global.editors.editors[editorIndex].defs),
        },
        ...global.editors.editors.slice(editorIndex + 1),
    ]
    historyAdd(editorIndex)
    global.editors.refreshToken.commit()
}


export function openEditor(editor: Editor)
{
    global.editors.editors.push(editor)
    global.editors.currentEditor = global.editors.editors.length - 1
    global.editors.refreshToken.commit()
    return global.editors.currentEditor
}


export async function openEditorByFile(rootRelativePath: string)
{
    const alreadyOpenedEditorIndex = global.editors.editors
        .findIndex(e => e.rootPath == rootRelativePath)

    if (alreadyOpenedEditorIndex >= 0)
    {
        global.editors.currentEditor = alreadyOpenedEditorIndex
        global.editors.refreshToken.commit()
    }

    else if (rootRelativePath.endsWith(Filesystem.DEFS_EXTENSION))
        await openEditorDefs(rootRelativePath)

    else if (rootRelativePath.endsWith(Filesystem.MAP_EXTENSION))
        await openEditorMap(rootRelativePath)

    Dev.refreshDevFile()
}


export function isEditorUnsaved(editor: Editor)
{
    if (editor.type === "defs")
        return editor.defs !== editor.lastSavedDefs

    if (editor.type === "map")
        return editor.map !== editor.lastSavedMap

    return false
}


export function isAnyEditorUnsaved()
{
    return global.editors.editors.some(e => isEditorUnsaved(e))
}


export function closeEditor(index: number)
{
    global.editors.editors.splice(index, 1)

    if (global.editors.currentEditor > index)
        global.editors.currentEditor -= 1

    global.editors.currentEditor = Math.min(
        global.editors.currentEditor,
        global.editors.editors.length - 1)

    for (let i = 0; i < global.editors.editors.length; i++)
    {
        const editor = global.editors.editors[i]
        if (editor.type === "map")
            editor.mapEditor.editorIndex = i
    }

    global.editors.refreshToken.commit()
}


export function setCurrentEditor(index: number)
{
    const prevEditor =
        global.editors.currentEditor >= 0 &&
        global.editors.currentEditor < global.editors.editors.length ?
            global.editors.editors[global.editors.currentEditor] :
            null
    
    global.editors.currentEditor = index

    const curEditor =
        index >= 0 &&
        index < global.editors.editors.length ?
            global.editors.editors[index] :
            null
    
    if (global.editors.mapEditing.syncEditorCameras &&
        prevEditor &&
        prevEditor.type == "map" &&
        curEditor &&
        curEditor.type == "map")
    {
        curEditor.mapEditor.camera = { ...prevEditor.mapEditor.camera }
        curEditor.mapEditor.camera.pos = { ...prevEditor.mapEditor.camera.pos }
    }

    global.editors.refreshToken.commit()
    Dev.refreshDevFile()
}


export function askAndCloseEditor(index: number)
{
    if (isEditorUnsaved(global.editors.editors[index]))
    {
        if (!window.confirm("Lose unsaved changes?"))
            return
    }

    closeEditor(index)
}


export async function saveCurrentEditor()
{
    const editor = global.editors.editors[global.editors.currentEditor]
    
    if (editor.type === "defs")
        await saveEditorDefs(global.editors.currentEditor)

    else if (editor.type === "map")
        await saveEditorMap(global.editors.currentEditor)
}


export async function openEditorDefs(rootRelativePath: string)
{
    try
    {
        const editor: EditorDefs = {
            type: "defs",
            name: Filesystem.getFileDisplayName(rootRelativePath),
            rootPath: rootRelativePath,
            basePath: Filesystem.removeLastPathComponent(rootRelativePath),
            defs: null!,
            lastSavedDefsSerialized: null!,
            lastSavedDefs: null!,
            history: [],
            historyPointer: -1,
        }

        await loadEditorDefs(editor)

        const editorIndex = openEditor(editor)
        historyAdd(editorIndex, "initial")
    }
    catch (e)
    {
        console.error(e)
        window.alert("An error occurred reading the file!\n\n" + e)
    }
}


export async function loadEditorDefs(editor: EditorDefs)
{
    let serDefsText = await Filesystem.readFileText(editor.rootPath)
    if (serDefsText.length === 0)
    {
        // Create new defs in case the file was empty,
        // which can happen due to showSaveFilePicker creating
        // an empty file automatically.
        serDefsText = DefsSerialization.stringify(
            DefsSerialization.serialize(
                Defs.makeNew()))
    }

    if (serDefsText === editor.lastSavedDefsSerialized)
        return true

    const serDefs = DefsSerialization.parse(serDefsText)
    const defs = DefsSerialization.deserialize(serDefs)

    editor.defs = defs
    editor.lastSavedDefsSerialized = serDefsText
    editor.lastSavedDefs = defs

    return true
}


export async function saveEditorDefs(editorIndex: number)
{
    try
    {
        const editorData = global.editors.editors[editorIndex] as EditorDefs

        historyAdd(editorIndex)

        const serDefs = DefsSerialization.serialize(editorData.defs)
        const serDefsText = DefsSerialization.stringify(serDefs)

        const file = await Filesystem.findFile(editorData.rootPath)

        const writable = await (file.handle as any).createWritable()
        await writable.write(serDefsText)
        await writable.close()

        editorData.lastSavedDefsSerialized = serDefsText
        editorData.lastSavedDefs = editorData.defs

        await refreshDefsForOpenEditors()

        global.editors.refreshToken.commit()
    }
    catch (e)
    {
        console.error(e)
        window.alert("An error occurred saving the file!\n\n" + e)
    }
}


export async function openEditorMap(rootRelativePath: string)
{
    try
    {
        const editor: EditorMap = {
            type: "map",
            name: Filesystem.getFileDisplayName(rootRelativePath),
            rootPath: rootRelativePath,
            basePath: Filesystem.removeLastPathComponent(rootRelativePath),
            defs: null!,
            lastSavedDefsSerialized: null!,
            defsRootPath: null!,
            defsBasePath: null!,
            map: null!,
            lastSavedMapSerialized: null!,
            lastSavedMap: null!,
            mapEditor: null!,
            history: [],
            historyPointer: -1,
        }

        if (!(await loadEditorMap(editor)))
            return

        const editorIndex = openEditor(editor)

        editor.mapEditor = MapEditor.createState(editorIndex, "")
        editor.mapEditor.camera.pos = Map.getDefaultCameraPosition(editor.map)

        historyAdd(editorIndex, "initial")
    }
    catch (e)
    {
        console.error(e)
        window.alert("An error occurred reading the file!\n\n" + e)
    }
}


export async function loadEditorMap(editor: EditorMap)
{
    const defsFile = await Filesystem.findNearestDefsFile(editor.rootPath)
    if (!defsFile)
    {
        window.alert(Filesystem.noDefsFileFoundMessage)
        return false
    }
    
    const serDefsText = await Filesystem.readFileText(defsFile.rootRelativePath)
    const serDefs = DefsSerialization.parse(serDefsText)
    const defs = DefsSerialization.deserialize(serDefs)

    let serMapText = await Filesystem.readFileText(editor.rootPath)
    if (serMapText.length === 0)
    {
        // Create a new map in case the file was empty,
        // which can happen due to showSaveFilePicker creating
        // an empty file automatically.
        serMapText = MapSerialization.stringify(defs,
            MapSerialization.serialize(defs,
                Map.makeNew(defs)))
    }

    if (serDefsText === editor.lastSavedDefsSerialized &&
        serMapText === editor.lastSavedMapSerialized)
        return true

    const serMap = MapSerialization.parse(serMapText)
    const map = MapSerialization.deserialize(defs, serMap)

    editor.defs = defs
    editor.lastSavedDefsSerialized = serDefsText,
    editor.defsRootPath = defsFile.rootRelativePath,
    editor.defsBasePath = Filesystem.removeLastPathComponent(defsFile.rootRelativePath),
    editor.map = map
    editor.lastSavedMapSerialized = serMapText
    editor.lastSavedMap = map

    return true
}


export async function saveEditorMap(editorIndex: number)
{
    try
    {
        const editorData = global.editors.editors[editorIndex] as EditorMap

        historyAdd(editorIndex)

        const serMap = MapSerialization.serialize(editorData.defs, editorData.map)
        const serMapText = MapSerialization.stringify(editorData.defs, serMap)

        const file = await Filesystem.findFile(editorData.rootPath)

        const writable = await (file.handle as any).createWritable()
        await writable.write(serMapText)
        await writable.close()

        editorData.lastSavedMapSerialized = serMapText
        editorData.lastSavedMap = editorData.map
        global.editors.refreshToken.commit()
    }
    catch (e)
    {
        console.error(e)
        window.alert("An error occurred saving the file!\n\n" + e)
    }
}


export async function refreshDefsForOpenEditors()
{
    for (let i = 0; i < global.editors.editors.length; i++)
    {
        const editor = global.editors.editors[i]
        if (editor.type === "map")
        {
            const defsFile = await Filesystem.findNearestDefsFile(editor.defsRootPath)
            if (!defsFile)
                continue
            
            const serDefsText = await Filesystem.readFileText(defsFile.rootRelativePath)
            if (serDefsText === editor.lastSavedDefsSerialized)
                continue
            
            const serDefs = DefsSerialization.parse(serDefsText)
            const defs = DefsSerialization.deserialize(serDefs)

            // Serialize the original map under the old defs,
            // then immediately deserialize it under the new defs
            // and compare differences
            const serMap = MapSerialization.serialize(
                editor.defs,
                editor.map)

            const serMapText = MapSerialization.stringify(
                editor.defs,
                serMap)

            const reloadedMap = MapSerialization.deserialize(
                defs,
                serMap)

            const serReloadedMap = MapSerialization.serialize(
                defs,
                reloadedMap)
    
            const serReloadedMapText = MapSerialization.stringify(
                defs,
                serReloadedMap)
    
            editor.defs = defs
            editor.lastSavedDefsSerialized = serDefsText

            if (serReloadedMapText !== serMapText)
            {
                editor.map = reloadedMap
                clearCache(i)
            }
        }
    }
}


export async function handleExternalFileChanges()
{
    await Filesystem.refreshEntries()

    for (let i = 0; i < global.editors.editors.length; i++)
    {
        const editor = global.editors.editors[i]
        historyAdd(i)

        if (editor.type === "defs")
            await loadEditorDefs(editor)
        else if (editor.type === "map")
            await loadEditorMap(editor)
        
        historyAdd(i, "reload")
        clearCache(i)
    }

    global.editors.refreshToken.commit()
}


export function historyAdd(editorIndex: number, tag?: string)
{
    const editor = global.editors.editors[editorIndex]
    if (editor.type === "map")
    {
        if (editor.history.length > 0 &&
            editor.history[editor.historyPointer].map === editor.map)
            return
        
        editor.history = editor.history.slice(0, editor.historyPointer + 1)

        editor.history.push({
            tag: tag ?? "",
            map: editor.map,
        })

        editor.historyPointer = editor.history.length - 1
    }

    else if (editor.type === "defs")
    {
        if (editor.history.length > 0 &&
            editor.history[editor.historyPointer].defs === editor.defs)
            return
        
        editor.history = editor.history.slice(0, editor.historyPointer + 1)

        editor.history.push({
            tag: tag ?? "",
            defs: editor.defs,
        })

        editor.historyPointer = editor.history.length - 1
    }
}


export function undo(editorIndex: number)
{
    const editor = global.editors.editors[editorIndex]

    if (editor.historyPointer - 1 < 0)
        return
    
    editor.historyPointer -= 1

    if (editor.type === "map")
    {
        editor.map = editor.history[editor.historyPointer].map
    }
    else if (editor.type === "defs")
    {
        editor.defs = editor.history[editor.historyPointer].defs
    }

    clearCache(editorIndex)
    render(editorIndex)
    global.editors.refreshToken.commit()
}


export function redo(editorIndex: number)
{
    const editor = global.editors.editors[editorIndex]

    if (editor.historyPointer + 1 >= editor.history.length)
        return
    
    editor.historyPointer += 1

    if (editor.type === "map")
    {
        editor.map = editor.history[editor.historyPointer].map
    }
    else if (editor.type === "defs")
    {
        editor.defs = editor.history[editor.historyPointer].defs
    }
    
    clearCache(editorIndex)
    render(editorIndex)
    global.editors.refreshToken.commit()
}


export function clearCache(editorIndex: number)
{
    const editor = global.editors.editors[editorIndex]
    if (editor.type === "map")
    {
        editor.mapEditor.cachedCanvases.clear()
    }
}


export function clearCacheAll()
{
    for (let i = 0; i < global.editors.editors.length; i++)
        clearCache(i)
}


export function render(editorIndex: number)
{
    const editor = global.editors.editors[editorIndex]
    if (editor.type === "map")
    {
        MapEditor.render(editor.mapEditor)
    }
}