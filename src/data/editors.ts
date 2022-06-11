import { RefreshToken } from "../util/refreshToken"
import { global } from "../global"
import { DeepAssignable, deepAssign } from "../util/deepAssign"
import * as Filesystem from "./filesystem"
import * as ID from "./id"
import * as Defs from "./defs"
import * as Map from "./map"
import * as MapEditor from "../mapEditor"


export interface Global
{
    refreshToken: RefreshToken
    editors: Editor[]
    currentEditor: number

    mapEditing:
    {
        layerDefId: ID.ID
    
        tileTool: TileTool
        tileToolBeforeKeyToggle: TileTool
        tileToolKeyToggled: boolean
    
        tilesetDefId: ID.ID
        tilesetStampSet: Set<number>
        tileStamp: Map.TileField

        selectedObjectDefId: ID.ID
    }
}


export const LAYERDEF_ID_WORLD = "world"


export type TileTool = "move" | "draw" | "erase" | "select"


export type Editor =
    EditorDefs |
    EditorMap


export interface EditorCommon
{
    name: string
    rootRelativePath: string
}


export interface EditorDefs extends EditorCommon
{
    type: "defs"
    defs: Defs.Defs
    lastSavedDefs: Defs.Defs
}


export interface EditorMap extends EditorCommon
{
    type: "map"
    defs: Defs.Defs
    map: Map.Map
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
            layerDefId: LAYERDEF_ID_WORLD,

            tileTool: "move",
            tileToolBeforeKeyToggle: "move",
            tileToolKeyToggled: false,
        
            tilesetDefId: "",
            tilesetStampSet: new Set<number>(),
            tileStamp: {
                tiles: [],
                width: 0,
                height: 0,
            },

            selectedObjectDefId: "",
        }
    }
}


export function deepAssignEditor<T extends Editor>(
    editorIndex: number,
    value: DeepAssignable<T>)
{
    global.editors.editors = [
        ...global.editors.editors.slice(0, editorIndex),
        deepAssign(global.editors.editors[editorIndex] as T, value),
        ...global.editors.editors.slice(editorIndex + 1),
    ]
    global.editors.refreshToken.commit()
}


export function openEditor(editor: Editor)
{
    global.editors.editors.push(editor)
    global.editors.currentEditor = global.editors.editors.length - 1
    global.editors.refreshToken.commit()
    return global.editors.currentEditor
}


export function openEditorByFile(rootRelativePath: string)
{
    if (rootRelativePath.endsWith(".mvdefs"))
        openEditorDefs(rootRelativePath)

    else
        openEditorMap(rootRelativePath)
}


export function isEditorUnsaved(editor: Editor)
{
    if (editor.type === "defs")
        return editor.defs !== editor.lastSavedDefs

    if (editor.type === "map")
        return editor.map !== editor.lastSavedMap

    return false
}


export async function openEditorDefs(rootRelativePath: string)
{
    try
    {
        const defsText = await Filesystem.readFileText(rootRelativePath)
        const defs = Defs.parse(defsText)
        const editor: EditorDefs = {
            type: "defs",
            name: rootRelativePath,
            rootRelativePath,
            defs,
            lastSavedDefs: defs,
        }
        openEditor(editor)
    }
    catch (e)
    {
        window.alert("An error occurred reading the file!\n\n" + e)
    }
}


export async function saveEditorDefs(editorIndex: number)
{
    try
    {
        const editorData = global.editors.editors[editorIndex] as EditorDefs

        const defsData = Defs.stringify(editorData.defs)

        const file = await Filesystem.findFile(editorData.rootRelativePath)

        const writable = await (file.handle as any).createWritable()
        await writable.write(defsData)
        await writable.close()

        editorData.lastSavedDefs = editorData.defs
        global.editors.refreshToken.commit()
    }
    catch (e)
    {
        window.alert("An error occurred saving the file!\n\n" + e)
    }
}


export async function openEditorMap(rootRelativePath: string)
{
    try
    {
        const defsFile = await Filesystem.findNearestDefsFile(rootRelativePath)
        if (!defsFile)
        {
            window.alert("No project file found!\n\nPlease create a project file first.")
            return
        }
        
        const defsText = await Filesystem.readFileText(defsFile.rootRelativePath)
        const defs = Defs.parse(defsText)

        const mapText = await Filesystem.readFileText(rootRelativePath)
        const map = Map.parse(mapText)

        const editor: EditorMap = {
            type: "map",
            name: rootRelativePath,
            rootRelativePath,
            defs,
            map,
            lastSavedMap: map,
            mapEditor: null!,
            history: [],
            historyPointer: -1,
        }

        const editorIndex = openEditor(editor)

        editor.mapEditor = MapEditor.createState(editorIndex, "")
        historyAdd(editorIndex, "initial")
    }
    catch (e)
    {
        window.alert("An error occurred reading the file!\n\n" + e)
    }
}


export async function saveEditorMap(editorIndex: number)
{
    try
    {
        const editorData = global.editors.editors[editorIndex] as EditorMap

        const mapData = Map.stringify(editorData.map)

        const file = await Filesystem.findFile(editorData.rootRelativePath)

        const writable = await (file.handle as any).createWritable()
        await writable.write(mapData)
        await writable.close()

        editorData.lastSavedMap = editorData.map
        global.editors.refreshToken.commit()
    }
    catch (e)
    {
        window.alert("An error occurred saving the file!\n\n" + e)
    }
}


export function historyAdd(editorIndex: number, tag?: string)
{
    const editor = global.editors.editors[editorIndex]
    if (editor.type === "map")
    {
        if (editor.history.length > 0 &&
            editor.history[editor.history.length - 1].map === editor.map)
            return
        
        editor.history = editor.history.slice(0, editor.historyPointer + 1)

        editor.history.push({
            tag: tag ?? "",
            map: editor.map,
        })

        editor.historyPointer = editor.history.length - 1
    }
}


export function undo(editorIndex: number)
{
    const editor = global.editors.editors[editorIndex]
    if (editor.type === "map")
    {
        if (editor.historyPointer - 1 < 0)
            return
        
        editor.historyPointer -= 1
        editor.map = editor.history[editor.historyPointer].map
        global.editors.refreshToken.commit()
    }
}


export function redo(editorIndex: number)
{
    const editor = global.editors.editors[editorIndex]
    if (editor.type === "map")
    {
        if (editor.historyPointer + 1 >= editor.history.length)
            return
        
        editor.historyPointer += 1
        editor.map = editor.history[editor.historyPointer].map
        global.editors.refreshToken.commit()
    }
}