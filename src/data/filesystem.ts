import { RefreshToken } from "../util/refreshToken"
import { global } from "../global"
import * as IndexedDBKeyVal from "idb-keyval"


export interface Global
{
    refreshToken: RefreshToken
    root: Directory
}


export interface Directory
{
    name: string
    handle: FileSystemDirectoryHandle | undefined
    childDirectories: Directory[]
    childFiles: File[]
}


export interface File
{
    name: string
}


export function makeNew(refreshToken: RefreshToken): Global
{
    return {
        refreshToken,
        root: {
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

    await refreshDirectory(global.filesystem.root)
    console.log(global.filesystem.root)
}


export async function refreshDirectory(directory: Directory)
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
                name: name,
            })
        }
        else if (handle.kind === "directory")
        {
            const newDirectory: Directory = {
                name,
                handle,
                childDirectories: [],
                childFiles: [],
            }

            directory.childDirectories.push(newDirectory)
            await refreshDirectory(newDirectory)
        }
    }
}