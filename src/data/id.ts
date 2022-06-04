export type ID = string


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
    const prefix = ""

    const newNextIDs = { ...nextIDs }

    const nextID = newNextIDs[prefix]
    newNextIDs[prefix] = nextID + 1

    return [newNextIDs, prefix + nextID]
}