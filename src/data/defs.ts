import { RefreshToken } from "../util/refreshToken"
import * as ID from "./id"
import * as Properties from "./properties"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export interface Defs
{
    nextIDs: ID.NextIDs
    generalDefs: DefGeneral
    layerDefs: DefLayer[]
    tilesetDefs: DefTileset[]
    objectDefs: DefObject[]
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


export interface DefObject
{
    id: ID.ID
    name: string

    imageSrc: string

    imageRect: MathUtils.RectWH

    pivotPercent: MathUtils.Point
    interactionRect: MathUtils.RectWH

    properties: Properties.DefProperties
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
        objectDefs: [],
    }
}


export function stringify(defs: Defs): string
{
    return JSON.stringify({
        ...defs,
        type: "defs",
        version: 1,
    },
    undefined, 2)
}


export function parse(data: string): Defs
{
    const json = JSON.parse(data)
    return { ...makeNew(), ...(json as Defs) }
}


export function getLayerDef(defs: Defs, layerDefId: ID.ID)
{
    return defs.layerDefs.find(l => l.id === layerDefId)
}


export function getTileset(defs: Defs, tilesetDefId: ID.ID)
{
    return defs.tilesetDefs.find(t => t.id === tilesetDefId)
}


export function getObjectDef(defs: Defs, objectDefId: ID.ID)
{
    return defs.objectDefs.find(o => o.id === objectDefId)
}


export function getTilesPerRow(tileset: DefTileset)
{
    return Math.floor(
        (tileset.width - tileset.gridOffsetX + tileset.gridGapX) /
        (tileset.gridCellWidth + tileset.gridGapX))
}


export function getTilesPerColumn(tileset: DefTileset)
{
    return Math.floor(
        (tileset.height - tileset.gridOffsetY + tileset.gridGapY) /
        (tileset.gridCellHeight + tileset.gridGapY))
}


export function getTileIndexForPixel(tileset: DefTileset, pos: { x: number, y: number }): number | undefined
{
    const x = Math.floor((pos.x - tileset.gridOffsetX) / (tileset.gridCellWidth  + tileset.gridGapX))
    const y = Math.floor((pos.y - tileset.gridOffsetY) / (tileset.gridCellHeight + tileset.gridGapY))
    
    return getTileIndexForCell(tileset, { x, y })
}


export function getPixelForTileIndex(tileset: DefTileset, tileIndex: number): { x: number, y: number }
{
    const cell = getCellForTileIndex(tileset, tileIndex)

    const x = tileset.gridOffsetX + cell.x * (tileset.gridCellWidth  + tileset.gridGapX)
    const y = tileset.gridOffsetY + cell.y * (tileset.gridCellHeight + tileset.gridGapY)
    
    return { x, y }
}


export function getTileIndexForCell(tileset: DefTileset, cell: { x: number, y: number }): number | undefined
{
    const tilesPerRow = getTilesPerRow(tileset)
    const tilesPerColumn = getTilesPerColumn(tileset)

    if (cell.x < 0 || cell.x >= tilesPerRow || cell.y < 0 || cell.y >= tilesPerColumn)
        return undefined
    
    return cell.y * tilesPerRow + cell.x
}


export function getCellForTileIndex(tileset: DefTileset, tileIndex: number): { x: number, y: number }
{
    const tilesPerRow = getTilesPerRow(tileset)
    
    const x = tileIndex % tilesPerRow
    const y = Math.floor(tileIndex / tilesPerRow)

    return { x, y }
}