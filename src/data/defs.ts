import { RefreshToken } from "../util/refreshToken"
import { global } from "../global"
import * as ID from "./id"


export interface Defs
{
    nextIDs: ID.NextIDs
    generalDefs: DefGeneral
    layerDefs: DefLayer[]
    tilesetDefs: DefTileset[]
}


export interface DefGeneral
{
    roomWidthMultiple: number
    roomHeightMultiple: number

    // The default dimensions of a new stage, in tiles of the
    // size multiple above
    roomDefaultWidthInTiles: number
    roomDefaultHeightInTiles: number
}


export type DefLayer =
    DefLayerTile |
    DefLayerObject


export interface DefLayerCommon
{
    id: ID.ID
    name: string

    gridCellWidth: number
    gridCellHeight: number
}


export interface DefLayerTile extends DefLayerCommon
{
    type: "tile"
}


export interface DefLayerObject extends DefLayerCommon
{
    type: "object"
}


export interface DefTileset
{
    id: ID.ID
    name: string

    imageSrc: string

    width: number
    height: number

    gridCellWidth: number
    gridCellHeight: number

    gridGapX: number
    gridGapY: number

    gridOffsetX: number
    gridOffsetY: number
}


export function makeNew(): Defs
{
    return {
        nextIDs: ID.makeNewNextIDs(),
        generalDefs: {
            roomWidthMultiple: 16,
            roomHeightMultiple: 16,
            roomDefaultWidthInTiles: 18,
            roomDefaultHeightInTiles: 10,
        },
        layerDefs: [],
        tilesetDefs: [],
    }
}


export function stringify(defs: Defs)
{
    return JSON.stringify({
        ...defs,
        type: "defs",
        version: 1,
    },
    undefined, 2)
}


export function parse(data: string)
{
    const json = JSON.parse(data)
    return json as Defs
}