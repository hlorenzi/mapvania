export type ID = string


export function getCurrentPrefix()
{
    if (!window.localStorage)
        return ""
    
    const prefix = window.localStorage.getItem("idPrefix")
    if (!prefix)
        return ""
    
    return prefix
}


export function setCurrentPrefix(newPrefix: string)
{
    if (!window.localStorage)
        return
    
    window.localStorage.setItem("idPrefix", newPrefix)
}


export interface NextIDs
{
    [forPrefix: string]: number
}


export function makeNewNextIDs(): NextIDs
{
    return { "": 1 }
}


export function getNextID(nextIDs: NextIDs): [NextIDs, string]
{
    const prefix = getCurrentPrefix()

    const newNextIDs = { ...nextIDs }

    if (!newNextIDs[prefix])
        newNextIDs[prefix] = 1

    const nextID = newNextIDs[prefix]
    newNextIDs[prefix] = nextID + 1

    return [newNextIDs, prefix + nextID]
}


export function compareIDs(a: ID, b: ID): number
{
    return a.localeCompare(b, "en")
}