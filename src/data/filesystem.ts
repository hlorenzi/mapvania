import { RefreshToken } from "../util/refreshToken"
import { global } from "../global"
import * as IndexedDBKeyVal from "idb-keyval"
import * as Defs from "../data/defs"
import * as DefsSerialization from "../data/defs_serialization"
import * as Map from "../data/map"
import * as MapSerialization from "../data/map_serialization"
import * as Editors from "../data/editors"


export const DIRECTORY_SEPARATOR = "/"
export const DEFS_EXTENSION = ".defs.json"
export const MAP_EXTENSION = ".map.json"
export const DEV_FILENAME = "dev.json"
export const BUILTIN_IMAGE_PREFIX = ":"
export const BUILTIN_IMAGE_SEPARATOR = ":"


const fileNotContainedInRootFolderMessage =
    "The selected file is not contained in the " +
    "currently opened folder or any of its subfolders!"


export interface Global
{
    refreshToken: RefreshToken
    root: Directory
}


export interface Directory
{
    rootRelativePath: string
    name: string
    handle: FileSystemDirectoryHandle | undefined
    childDirectories: Directory[]
    childFiles: File[]
}


export interface File
{
    rootRelativePath: string
    name: string
    handle: FileSystemFileHandle
}


export function makeNew(refreshToken: RefreshToken): Global
{
    return {
        refreshToken,
        root: {
            rootRelativePath: "./",
            name: "",
            handle: undefined,
            childDirectories: [],
            childFiles: [],
        }
    }
}


export async function openRootDirectory()
{
    if (!("showOpenFilePicker" in window))
    {
        window.alert(
            "Your browser does not support the File System Access API!\n\n" +
            "It's currently supported in Chrome, Edge, and Safari.")
    }
    
    const handle = await window.showDirectoryPicker({ id: "mainFolder" })
    if (!handle)
        return

    await setRootDirectory(handle)
}


export async function setRootDirectory(handle: FileSystemDirectoryHandle)
{
    global.filesystem.root.handle = handle
    await refreshEntries()
    await cacheRootDirectory()
    global.filesystem.refreshToken.commit()
}


export async function setRootDirectoryFromCache()
{
    const cachedRootDirectory = await retrieveCachedRootFolder()
    if (cachedRootDirectory)
    {
        await (cachedRootDirectory as any).requestPermission()
        await setRootDirectory(cachedRootDirectory)
    }
}


export async function cacheRootDirectory()
{
    await IndexedDBKeyVal.set("rootDirectoryHandle", global.filesystem.root.handle)
}


export async function retrieveCachedRootFolder()
{
    const handle =
        await IndexedDBKeyVal.get<FileSystemDirectoryHandle>("rootDirectoryHandle")

    return handle
}


export async function refreshEntries()
{
    if (!global.filesystem.root.handle)
        throw "invalid global folder handle"

    await refreshDirectory(global.filesystem.root, global.filesystem.root.rootRelativePath)
    console.log("Filesystem.refreshEntries finished", global.filesystem.root)
}


export async function refreshDirectory(directory: Directory, path: string)
{
    directory.childDirectories = []
    directory.childFiles = []
    
    for await (const entry of (directory.handle as any))
    {
        const name: string = entry[0]
        const handle: FileSystemFileHandle | FileSystemDirectoryHandle = entry[1]

        if (handle.kind === "file")
        {
            if (!isIgnorableFile(path + name))
            {
                directory.childFiles.push({
                    rootRelativePath: path + name,
                    name: name,
                    handle,
                })
            }
        }
        else if (handle.kind === "directory")
        {
            const newDirectory: Directory = {
                rootRelativePath: path + name,
                name,
                handle,
                childDirectories: [],
                childFiles: [],
            }

            directory.childDirectories.push(newDirectory)

            await refreshDirectory(
                newDirectory,
                path + name + DIRECTORY_SEPARATOR)
        }
    }
}


export function isIgnorableFile(rootRelativePath: string)
{
    return rootRelativePath.endsWith(".meta")
}


export async function findFile(
    rootRelativePath: string,
    create?: boolean)
{
    let pathComponents = rootRelativePath.split(DIRECTORY_SEPARATOR)

    pathComponents = pathComponents.slice(1)

    let currentDirectory = global.filesystem.root
    while (pathComponents.length > 1)
    {
        const nextDirectory = currentDirectory.childDirectories
            .find(d => d.name === pathComponents[0])

        if (!nextDirectory)
            throw ("intermediary directory not found for file: `" + rootRelativePath + "`")
    
        currentDirectory = nextDirectory
        pathComponents = pathComponents.slice(1)
    }

    let file = currentDirectory.childFiles
        .find(f => f.name === pathComponents[0])
        
    if (!file)
    {
        if (!create)
            throw ("file not found: `" + rootRelativePath + "`")

        file = {
            rootRelativePath,
            name: pathComponents[0],
            handle: await currentDirectory.handle!.getFileHandle(pathComponents[0], { create: true }),
        }

        currentDirectory.childFiles.push(file)
    }

    return file
}


export async function findNearestDefsFile(
    startingFromRootRelativePath: string)
    : Promise<File | null>
{
    return findNearestFileRecursive(
        global.filesystem.root,
        f => f.name.endsWith(DEFS_EXTENSION))
}


async function findNearestFileRecursive(
    currentDirectory: Directory,
    filter: (f: File) => boolean)
    : Promise<File | null>
{
    const file = currentDirectory.childFiles.find(filter)
    if (file)
        return file

    for (const childDirectory of currentDirectory.childDirectories)
    {
        const innerFile = await findNearestFileRecursive(childDirectory, filter)
        if (innerFile)
            return innerFile
    }

    return null
}


export async function readFileText(rootRelativePath: string)
{
    const file = await findFile(rootRelativePath)
    const fileData = await file.handle.getFile()
    const text = await fileData.text()
    return text
}


export async function writeFileText(rootRelativePath: string, data: string)
{
    const file = await findFile(rootRelativePath, true)
    
    const writable = await (file.handle as any).createWritable()
    await writable.write(data)
    await writable.close()
}


export async function getRootRelativePath(fileHandle: FileSystemFileHandle): Promise<string | undefined>
{
    const resolved = await global.filesystem.root.handle!.resolve(fileHandle)
    if (!resolved)
        return undefined

    return DIRECTORY_SEPARATOR + resolved.join(DIRECTORY_SEPARATOR)
}


export async function showNewDefsFilePicker()
{
    const handle = await window.showSaveFilePicker({
        suggestedName: "defs" + DEFS_EXTENSION,
        types: [
            {
                description: "Mapvania Definitions File",
                accept: {
                    "text/json": [DEFS_EXTENSION],
                }
            },
        ]
    })
    if (!handle)
        return

    try
    {
        const rootRelativePath = await getRootRelativePath(handle)
        if (!rootRelativePath)
        {
            window.alert(fileNotContainedInRootFolderMessage)
            return
        }

        const defs = Defs.makeNew()
        const serDefs = DefsSerialization.serialize(defs)
        const serDefsText = DefsSerialization.stringify(serDefs)

        const writable = await handle.createWritable()
        await writable.write(serDefsText)
        await writable.close()

        await refreshEntries()

        await Editors.openEditorDefs(rootRelativePath)
    }
    catch (e)
    {
        console.error(e)
        window.alert("An error occurred!\n\n" + e)
    }
}


export async function showNewMapFilePicker()
{
    const handle = await window.showSaveFilePicker({
        suggestedName: "map" + MAP_EXTENSION,
        types: [
            {
                description: "Mapvania Map File",
                accept: {
                    "text/json": [MAP_EXTENSION],
                }
            },
        ]
    })

    if (!handle)
        return

    try
    {
        const rootRelativePath = await getRootRelativePath(handle)
        if (!rootRelativePath)
        {
            window.alert(fileNotContainedInRootFolderMessage)
            return
        }

        const defsFile = await findNearestDefsFile(rootRelativePath)
        if (!defsFile)
        {
            window.alert("No defs file found!\n\nPlease create a defs file first.")
            return
        }
        
        const serDefsText = await readFileText(defsFile.rootRelativePath)
        const serDefs = DefsSerialization.parse(serDefsText)
        const defs = DefsSerialization.deserialize(serDefs)
    
        const map = Map.makeNew()
        const serMap = MapSerialization.serialize(defs, map)
        const serMapText = MapSerialization.stringify(defs, serMap)

        const writable = await handle.createWritable()
        await writable.write(serMapText)
        await writable.close()

        await refreshEntries()

        await Editors.openEditorMap(rootRelativePath)
    }
    catch (e)
    {
        console.error(e)
        window.alert("An error occurred!\n\n" + e)
    }
}


export async function showImagePicker(): Promise<string | undefined>
{
    const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
            description: "PNG Images",
            accept: {
                "image/png": [".png"],
            },
        }]
    })

    if (!handle)
        return undefined

    const rootRelativePath = await getRootRelativePath(handle)
    if (!rootRelativePath)
    {
        window.alert("The selected file is not contained in the root folder!")
        throw "file not contained in root folder"
    }

    // Refresh entries in case the file is not yet cached
    try
    {
        await findFile(rootRelativePath)
    }
    catch
    {
        await refreshEntries()
    }

    return rootRelativePath
}


export function isRecognizedFile(rootRelativePath: string)
{
    if (rootRelativePath.endsWith(DEFS_EXTENSION))
        return true

    if (rootRelativePath.endsWith(MAP_EXTENSION))
        return true

    return false
}


export function getFileDisplayName(rootRelativePath: string)
{
    if (rootRelativePath.endsWith(DEFS_EXTENSION))
        return "⚙️ " + rootRelativePath.replace("./", "").replace(DEFS_EXTENSION, "")

    if (rootRelativePath.endsWith(MAP_EXTENSION))
        return "🗺️ " + rootRelativePath.replace("./", "").replace(MAP_EXTENSION, "")

    return rootRelativePath
}