import { RefreshToken } from "../util/refreshToken"
import { global } from "../global"
import * as IndexedDBKeyVal from "idb-keyval"


export const DIRECTORY_SEPARATOR = "/"


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
            rootRelativePath: "/",
            name: "",
            handle: undefined,
            childDirectories: [],
            childFiles: [],
        }
    }
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

    console.log(handle)
    return handle
}


export async function refreshEntries()
{
    if (!global.filesystem.root.handle)
        throw "invalid global folder handle"

    await refreshDirectory(global.filesystem.root, "/")
    console.log(global.filesystem.root)
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
            directory.childFiles.push({
                rootRelativePath: path + name,
                name: name,
                handle,
            })
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


export async function findFile(rootRelativePath: string)
{
    let pathComponents = rootRelativePath.split(DIRECTORY_SEPARATOR)
    console.log(pathComponents)

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

    const file = currentDirectory.childFiles
        .find(f => f.name === pathComponents[0])
        
    if (!file)
        throw ("file not found: `" + rootRelativePath + "`")

    return file
}


export async function findNearestDefsFile(startingFromRootRelativePath: string)
{
    return findNearestFileRecursive(global.filesystem.root, f => f.name.endsWith(".mvdefs"))
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


export async function getRootRelativePath(fileHandle: FileSystemFileHandle): Promise<string | undefined>
{
    const resolved = await global.filesystem.root.handle!.resolve(fileHandle)
    if (!resolved)
        return undefined

    return DIRECTORY_SEPARATOR + resolved.join(DIRECTORY_SEPARATOR)
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

    return rootRelativePath
}