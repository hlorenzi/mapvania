export type Items<T extends Item> = T[]


export type FoldersAndItems<T extends Item> = (T | Folder)[]


export type FolderId = string[]


export const FOLDER_ID_PREFIX = "f:"
export const FOLDER_SEPARATOR = "/"


export interface Item
{
    id: string
    folder?: FolderId
}


export interface Folder
{
    isFolder: true
    id: string
    folder: FolderId
}


export interface Actions<T extends Item>
{
    create: () => T
}


export function stringifyFolder(folder: FolderId): string
{
    return folder.join(FOLDER_SEPARATOR)
}


export function parseFolder(folder: string): FolderId
{
    if (folder === "")
        return []
    
    return folder
        .split(FOLDER_SEPARATOR)
        .map(f => f.trim())
        .filter(f => f.length > 0)
}


export function isSameFolder(a: FolderId, b: FolderId): boolean
{
    if (a.length != b.length)
        return false

    for (let i = 0; i < a.length; i++)
    {
        if (a[i] != b[i])
            return false
    }

    return true
}


export function isSubFolder(superfolder: FolderId, subfolder: FolderId): boolean
{
    if (superfolder.length >= subfolder.length)
        return false

    for (let i = 0; i < superfolder.length; i++)
    {
        if (superfolder[i] !== subfolder[i])
            return false
    }

    return true
}


export function getItemsAndSubfoldersAt<T extends Item>(
    allItems: Items<T>,
    folder: FolderId)
    : FoldersAndItems<T>
{
    const subfoldersSet = new Set<string>()
    const items: T[] = []

    for (const item of allItems)
    {
        if (isSameFolder(folder, item.folder ?? []))
            items.push(item)

        // FIXME: flattens recursive folder hierarchy
        else if (isSubFolder(folder, item.folder ?? []))
            subfoldersSet.add(stringifyFolder(item.folder ?? []))
    }

    const subfoldersJoined = [...subfoldersSet]
    subfoldersJoined.sort((a, b) => a.localeCompare(b))
    
    const subfolders: Folder[] = subfoldersJoined.map(sf => ({
        isFolder: true,
        id: FOLDER_ID_PREFIX + sf,
        folder: sf.split(FOLDER_SEPARATOR),
    }))

    return [
        ...subfolders,
        ...items,
    ]
}


export function getRangeOfIdsBetween<T extends Item>(
    foldersAndItems: FoldersAndItems<T>,
    fromId: string,
    toId: string)
    : string[]
{
    const fromIndex = foldersAndItems.findIndex(i => i.id === fromId)
    if (fromIndex < 0)
        return []

    const toIndex = foldersAndItems.findIndex(i => i.id === toId)
    if (toIndex < 0)
        return []

    return foldersAndItems.slice(
            Math.min(fromIndex, toIndex),
            Math.max(fromIndex, toIndex) + 1)
        .map(i => i.id)
}


export function moveItems<T extends Item>(
    allItems: Items<T>,
    folder: FolderId,
    idsToMove: Set<string>,
    moveDelta: number)
    : Items<T>
{
    if (allItems.length === 0)
        return allItems

    if (idsToMove.size === 0)
        return allItems

    const localItems = getItemsAndSubfoldersAt(allItems, folder)
        .filter(item => !("isFolder" in item))

    if (localItems.length === 0)
        return allItems

    const itemsToMove = allItems.filter(item => idsToMove.has(item.id))
    const allItemsWithSelectionDeleted = allItems.filter(item => !idsToMove.has(item.id))
    const idsToMoveArray = [...idsToMove]

    let moveToIndex = 0

    if (moveDelta < 0)
    {
        let topmostIndex = localItems.length - 1
        for (let i = 0; i < idsToMoveArray.length; i++)
        {
            const index = localItems.findIndex(item => item.id === idsToMoveArray[i])
            if (index < 0)
                return allItems

            if (index < topmostIndex)
                topmostIndex = index
        }

        if (topmostIndex == 0)
            return allItems

        moveToIndex = allItemsWithSelectionDeleted.findIndex(
            item => item.id === localItems[Math.max(0, topmostIndex - 1)].id)
    }
    else
    {
        let bottomostIndex = 0
        for (let i = 0; i < idsToMoveArray.length; i++)
        {
            const index = localItems.findIndex(item => item.id === idsToMoveArray[i])
            if (index < 0)
                return allItems

            if (index > bottomostIndex)
                bottomostIndex = index
        }

        if (bottomostIndex >= localItems.length - 1)
            return allItems

        moveToIndex = allItemsWithSelectionDeleted.findIndex(
            item => item.id === localItems[Math.min(localItems.length - 1, bottomostIndex + 1)].id) + 1
    }

    return [
        ...allItemsWithSelectionDeleted.slice(0, moveToIndex),
        ...itemsToMove,
        ...allItemsWithSelectionDeleted.slice(moveToIndex),
    ]
}