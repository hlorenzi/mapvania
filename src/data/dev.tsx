import * as ID from "./id"
import * as Filesystem from "./filesystem"
import { global } from "../global"


export function getCurrentWriteDevFile(): boolean
{
    if (!window.localStorage)
        return false
    
    const write = window.localStorage.getItem("writeDevFile")
    if (!write)
        return false
    
    return write == "true"
}


export function setCurrentWriteDevFile(write: boolean)
{
    if (!window.localStorage)
        return
    
    window.localStorage.setItem("writeDevFile", write ? "true" : "false")
}


export interface DevFileContents
{
    currentMapFilename: string
    currentRoomId: ID.ID
}


export function refreshDevFile()
{
    if (!getCurrentWriteDevFile())
        return
    
    const editor = global.editors.editors[global.editors.currentEditor]
    if (!editor || editor.type !== "map")
        return

    const contents: DevFileContents = {
        currentMapFilename: editor.rootPath,
        currentRoomId: editor.mapEditor.roomId,
    }

    writeDevFile(editor.defsRootPath, contents)
}


let lastWrittenDevFile: DevFileContents | null = null

let writeDevFileToken = 0
let writeDevFileLock = false


async function writeDevFile(
    defsRootRelativePath: string,
    contents: DevFileContents)
{
    if (lastWrittenDevFile !== null)
    {
        if (lastWrittenDevFile.currentMapFilename == contents.currentMapFilename &&
            lastWrittenDevFile.currentRoomId == contents.currentRoomId)
            return
    }

    lastWrittenDevFile = contents
    
    const defsDirectory = defsRootRelativePath.slice(
        0, defsRootRelativePath.lastIndexOf(Filesystem.DIRECTORY_SEPARATOR) + 1)

    const devFilename = defsDirectory + Filesystem.DEV_FILENAME

    const token = ++writeDevFileToken

    while (writeDevFileLock)
    {
        await new Promise((resolve, _) => window.setTimeout(resolve, 100))
    }

    if (token !== writeDevFileToken)
        return

    try
    {
        writeDevFileLock = true
        await Filesystem.writeFileText(devFilename, JSON.stringify(contents))
    }
    finally
    {
        writeDevFileLock = false
    }
}