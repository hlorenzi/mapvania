import { RefreshToken } from "../util/refreshToken"
import { global } from "../global"
import { DeepAssignable, deepAssign } from "../util/deepAssign"
import * as Filesystem from "./filesystem"
import * as Defs from "./defs"


export interface Global
{
    refreshToken: RefreshToken
    editors: Editor[]
    currentEditor: number
}


export type Editor =
    EditorDefs


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


export function makeNew(refreshToken: RefreshToken): Global
{
    return {
        refreshToken,
        editors: [],
        currentEditor: -1,
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
}


export function isEditorUnsaved(editor: Editor)
{
    if (editor.type === "defs")
        return editor.defs !== editor.lastSavedDefs

    return false
}


export async function openEditorDefs(rootRelativePath: string)
{
    try
    {
        const text = await Filesystem.readFileText(rootRelativePath)
        const defs = { ...Defs.makeNew(), ...Defs.parse(text) }
        const editorDefs: EditorDefs = {
            type: "defs",
            name: rootRelativePath,
            rootRelativePath,
            defs,
            lastSavedDefs: defs,
        }
        openEditor(editorDefs)
        console.log(editorDefs)
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
        const editorData = global.editors.editors[editorIndex]

        const defsData = Defs.stringify(editorData.defs)

        const file = await Filesystem.findFile(editorData.rootRelativePath)

        const writable = await (file.handle as any).createWritable()
        await writable.write(defsData)
        await writable.close()

        global.editors.editors[editorIndex].lastSavedDefs = editorData.defs
        global.editors.refreshToken.commit()
    }
    catch (e)
    {
        window.alert("An error occurred saving the file!\n\n" + e)
    }
}