import { RefreshToken } from "../util/refreshToken"
import { global } from "../global"
import * as IndexedDBKeyVal from "idb-keyval"
import * as Defs from "../data/defs"
import * as DefsSerialization from "../data/defs_serialization"
import * as Map from "../data/map"
import * as MapSerialization from "../data/map_serialization"
import * as Editors from "../data/editors"


export const DIRECTORY_SEPARATOR = "/"
export const PROJECT_ROOT_PATH = "./"
export const DEFS_EXTENSION = ".defs.json"
export const DEFS_DEFAULT_FILENAME = "defs"
export const MAP_EXTENSION = ".map.json"
export const MAP_DEFAULT_FILENAME = "map"
export const DEV_FILENAME = "dev.json"
export const BUILTIN_IMAGE_PREFIX = ":"
export const BUILTIN_IMAGE_SEPARATOR = ":"


export const fileNotContainedInRootFolderMessage =
    "The selected file is not contained in the " +
    "currently opened project folder or any of its subfolders!"

export const noDefsFileFoundMessage =
    "No defs file found!\n\n" +
    "Please create a defs file first."


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
    parentDirectory: Directory | null
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
            rootRelativePath: PROJECT_ROOT_PATH,
            name: "",
            handle: undefined,
            parentDirectory: null,
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

    global.filesystem.root = {
        rootRelativePath: PROJECT_ROOT_PATH,
        name: "",
        handle: global.filesystem.root.handle,
        parentDirectory: null,
        childDirectories: [],
        childFiles: [],
    }

    await refreshDirectory(
        global.filesystem.root,
        global.filesystem.root.rootRelativePath)
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
                parentDirectory: directory,
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


export function findDirectory(
    rootPath: string)
    : Directory | undefined
{
    let rootComponents = rootPath
        .split(DIRECTORY_SEPARATOR)
        .filter(d => !!d)
        .filter(d => d !== ".")

    let currentDirectory = global.filesystem.root
    while (rootComponents.length > 1)
    {
        const nextDirectory = currentDirectory.childDirectories
            .find(d => d.name === rootComponents[0])

        if (!nextDirectory)
            return undefined // Intermediary directory not found
    
        currentDirectory = nextDirectory
        rootComponents = rootComponents.slice(1)
    }

    const directory = currentDirectory.childDirectories
        .find(dir => dir.name === rootComponents[0])

    if (!directory)
        return currentDirectory
    
    return directory
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
    const startingDirectory = findDirectory(startingFromRootRelativePath)
    if (!startingDirectory)
        return null

    return findNearestFileRecursive(
        startingDirectory,
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

    // Recurse up to parent directory.
    if (currentDirectory.parentDirectory)
    {
        return findNearestFileRecursive(
            currentDirectory.parentDirectory,
            filter)
    }

    return null
}


export function removeLastPathComponent(path: string): string
{
    let components = path.split(DIRECTORY_SEPARATOR)
    if (components.length <= 1)
        return PROJECT_ROOT_PATH

    return components
        .slice(0, components.length - 1)
        .join(DIRECTORY_SEPARATOR)
}


export function makeRelativePath(
    basePath: string,
    destinationPath: string)
    : string
{
    if (destinationPath.startsWith(BUILTIN_IMAGE_PREFIX))
        return destinationPath
    
    let baseComponents = basePath
        .split(DIRECTORY_SEPARATOR)
        .filter(d => !!d)
        .filter(d => d !== ".")

    let destComponents = destinationPath
        .split(DIRECTORY_SEPARATOR)
        .filter(d => !!d)
        .filter(d => d !== ".")

    let result: string[] = []

    let lastCommonPrefix = 0
    while (lastCommonPrefix < baseComponents.length &&
        lastCommonPrefix < destComponents.length)
    {
        if (baseComponents[lastCommonPrefix] !== destComponents[lastCommonPrefix])
            break

        lastCommonPrefix++
    }

    for (let i = lastCommonPrefix; i < baseComponents.length; i++)
        result.push("..")

    for (let i = lastCommonPrefix; i < destComponents.length; i++)
        result.push(destComponents[i])

    let resultPath = result.join(DIRECTORY_SEPARATOR)
    if (result.length === 0 || result[0] !== "..")
        resultPath = PROJECT_ROOT_PATH + resultPath

    /*console.log(
        "makeRelativePath",
        basePath,
        destinationPath,
        baseComponents,
        destComponents,
        lastCommonPrefix,
        resultPath)*/

    return resultPath
}


export function resolveRelativePath(
    basePath: string,
    relativePath: string)
    : string
{
    if (relativePath.startsWith(BUILTIN_IMAGE_PREFIX))
        return relativePath
    
    let baseComponents = basePath
        .split(DIRECTORY_SEPARATOR)
        .filter(d => !!d)

    let relativeComponents = relativePath
        .split(DIRECTORY_SEPARATOR)
        .filter(d => !!d)

    for (let i = 0; i < relativeComponents.length; i++)
    {
        if (relativeComponents[i] === "..")
        {
            baseComponents = baseComponents.slice(0, baseComponents.length - 1)
        }
        else if (relativeComponents[i] === "." ||
            relativeComponents[i] === "")
        {
            continue
        }
        else
        {
            baseComponents = [...baseComponents, relativeComponents[i]]
        }
    }

    const resultPath = baseComponents.join(DIRECTORY_SEPARATOR)

    /*console.log(
        "resolveRelativePath",
        basePath,
        relativePath,
        resultPath)*/

    return resultPath
}


export async function readFileLastModified(rootRelativePath: string)
{
    const file = await findFile(rootRelativePath)
    const fileData = await file.handle.getFile()
    return fileData.lastModified
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

    return PROJECT_ROOT_PATH + resolved.join(DIRECTORY_SEPARATOR)
}


export async function showNewDefsFilePicker(startIn?: FileSystemHandle)
{
    const handle = await window.showSaveFilePicker({
        suggestedName: DEFS_DEFAULT_FILENAME,
        startIn,
        types: [
            {
                description: "Mapvania Definitions File",
                accept: {
                    "text/json": [DEFS_EXTENSION],
                }
            },
        ]
    } as SaveFilePickerOptions)

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


export async function showNewMapFilePicker(startIn?: FileSystemHandle)
{
    const handle = await window.showSaveFilePicker({
        suggestedName: MAP_DEFAULT_FILENAME,
        startIn,
        types: [
            {
                description: "Mapvania Map File",
                accept: {
                    "text/json": [MAP_EXTENSION],
                }
            },
        ]
    } as SaveFilePickerOptions)

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
            window.alert(noDefsFileFoundMessage)
            return
        }
        
        const serDefsText = await readFileText(defsFile.rootRelativePath)
        const serDefs = DefsSerialization.parse(serDefsText)
        const defs = DefsSerialization.deserialize(serDefs)
    
        const map = Map.makeNew(defs)
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


export async function showImagePicker(
    basePath: string)
    : Promise<string | undefined>
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

    const imageRootPath = await getRootRelativePath(handle)
    if (!imageRootPath)
    {
        window.alert(fileNotContainedInRootFolderMessage)
        throw "file not contained in root folder"
    }

    // Refresh entries in case the file is not yet cached
    try
    {
        await findFile(imageRootPath)
    }
    catch
    {
        await refreshEntries()
    }

    return makeRelativePath(basePath, imageRootPath)
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