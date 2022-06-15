import * as React from "react"
import { RefreshToken } from "../util/refreshToken"
import * as ID from "./id"
import * as Images from "./images"
import * as Properties from "./properties"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export interface Defs
{
    nextIDs: ID.NextIDs
    generalDefs: DefGeneral
    layerDefs: DefLayer[]
    tilesetDefs: DefTileset[]
    tileAttributeDefs: DefTileAttribute[]
    objectDefs: DefObject[]
}


export interface DefGeneral
{
    roomWidthMultiple: number
    roomHeightMultiple: number
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

    tileAttributes: ID.ID[][]
}


export interface DefTileAttribute
{
    id: ID.ID
    name: string

    label: string
    color: string
}


export interface DefObject
{
    id: ID.ID
    name: string

    imageSrc: string
    imageRect: MathUtils.RectWH
    resizeable: boolean

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
        },
        layerDefs: [],
        tilesetDefs: [],
        tileAttributeDefs: [],
        objectDefs: [],
    }
}

export function makeNewObjectDef(): DefObject
{
    return {
        id: "",
        name: "",
        imageSrc: "",
        imageRect: { x: 0, y: 0, width: 0, height: 0 },
        resizeable: false,
        pivotPercent: { x: 0, y: 0 },
        interactionRect: { x: 0, y: 0, width: 16, height: 16 },
        properties: [],
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


export function getTileAttributeDef(defs: Defs, tileAttributeDefId: ID.ID)
{
    return defs.tileAttributeDefs.find(a => a.id === tileAttributeDefId)
}


export function getObjectDef(defs: Defs, objectDefId: ID.ID)
{
    return defs.objectDefs.find(o => o.id === objectDefId)
}


export function getObjectPropertyDefs(defs: Defs, objectDef: DefObject)
{
    return objectDef.properties
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


export function getTotalTileNumber(tileset: DefTileset)
{
    return getTilesPerRow(tileset) * getTilesPerColumn(tileset)
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


export function getTileAttributesForTile(
    tileAttributes: DefTileset["tileAttributes"],
    tileIndex: number)
    : ID.ID[]
{
    if (tileIndex < 0 || tileIndex >= tileAttributes.length)
        return []

    return tileAttributes[tileIndex]
}


export function setTileAttributesForTile(
    tileAttributes: DefTileset["tileAttributes"],
    tileIndex: number,
    attributes: ID.ID[])
    : DefTileset["tileAttributes"]
{
    const newTileAttributes = [...tileAttributes]
    while (tileIndex >= newTileAttributes.length)
        newTileAttributes.push([])

    newTileAttributes[tileIndex] = attributes
    return newTileAttributes
}


export function getTilesetDefIconElement(tilesetDef: DefTileset): React.ReactNode | null
{
    const image = Images.getImageLazy(tilesetDef.imageSrc)
    if (!image)
        return <span/>

    return <div style={{
        objectFit: "contain",
        display: "inline-block",
    }}>
        <div style={{
            width: Math.min(64, tilesetDef.width) + "px",
            height: Math.min(64, tilesetDef.height) + "px",
            overflow: "hidden",
        }}>
            <img
                src={ image.element.src }
                style={{
                    marginLeft: (-tilesetDef.gridOffsetX) + "px",
                    marginTop: (-tilesetDef.gridOffsetY) + "px",
            }}/>
        </div>
    </div>
}


export function getTileAttributeDefIconElement(tileAttributeDef: DefTileAttribute): React.ReactNode | null
{
    return <div style={{
        marginRight: "0.5em",
        display: "inline-block",
        color: tileAttributeDef.color,
    }}>
        { tileAttributeDef.label }
    </div>
}


export function getObjectDefIconElement(objectDef: DefObject): React.ReactNode | null
{
    const image = Images.getImageLazy(objectDef.imageSrc)
    if (!image)
        return <span/>

    return <div style={{
        objectFit: "contain",
        display: "inline-block",
    }}>
        <div style={{
            width: Math.min(64, objectDef.imageRect.width) + "px",
            height: Math.min(64, objectDef.imageRect.height) + "px",
            overflow: "hidden",
        }}>
            <img
                src={ image.element.src }
                style={{
                    marginLeft: (-objectDef.imageRect.x) + "px",
                    marginTop: (-objectDef.imageRect.y) + "px",
            }}/>
        </div>
    </div>
}