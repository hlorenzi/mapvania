import * as React from "react"
import { RefreshToken } from "../util/refreshToken"
import * as ID from "./id"
import * as Hierarchy from "./hierarchy"
import * as Images from "./images"
import * as Properties from "./properties"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export interface Defs
{
    nextIDs: ID.NextIDs
    generalDefs: DefGeneral
    layerDefs: Hierarchy.Items<DefLayer>
    tilesetDefs: Hierarchy.Items<DefTileset>
    tileAttributeDefs: Hierarchy.Items<DefTileAttribute>
    tileBrushDefs: Hierarchy.Items<DefTileBrush>
    objectDefs: Hierarchy.Items<DefObject>
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
    folder: Hierarchy.FolderId,

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


export interface DefTileBrush
{
    id: ID.ID
    name: string
    folder: Hierarchy.FolderId

    tilesetDefId: ID.ID

    tiles: {
        [stringifiedTileIndex: string]: {
            type: BrushTileType
            connections: [
                boolean, boolean, boolean,
                boolean, boolean, boolean,
                boolean, boolean, boolean,
            ]
            neighbors: [
                BrushTileType,
                BrushTileType,
                BrushTileType,
                BrushTileType,
            ]
        }
    }
}


export type BrushTileType = "rect" | "diagUL" | "diagUR" | "diagDL" | "diagDR"


export interface DefObject
{
    id: ID.ID
    name: string
    folder: Hierarchy.FolderId

    imageSrc: string
    imageRect: MathUtils.RectWH
    resizeable: boolean

    pivotPercent: MathUtils.Point
    interactionRect: MathUtils.RectWH

    inheritPropertiesFromObjectDefs: ID.ID[]
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
        tileBrushDefs: [],
        objectDefs: [],
    }
}


export function makeNewLayerDef(id: ID.ID): DefLayer
{
    return {
        id,
        name: "layer_" + id,
        type: "tile",
        gridCellWidth: 16,
        gridCellHeight: 16,
    }
}


export function makeNewTilesetDef(id: ID.ID): DefTileset
{
    return {
        id,
        name: "tileset_" + id,
        folder: [],
        imageSrc: "",
        width: 0,
        height: 0,
        gridCellWidth: 16,
        gridCellHeight: 16,
        gridGapX: 0,
        gridGapY: 0,
        gridOffsetX: 0,
        gridOffsetY: 0,
        tileAttributes: [],
    }
}


export function makeNewTileAttributeDef(id: ID.ID): DefTileAttribute
{
    return {
        id,
        name: "attribute_" + id,
        label: "A",
        color: "#ffffff",
    }
}


export function makeNewTileBrushDef(id: ID.ID): DefTileBrush
{
    return {
        id,
        name: "brush_" + id,
        folder: [],
        tilesetDefId: "",
        tiles: {},
    }
}


export function makeNewObjectDef(id: ID.ID): DefObject
{
    return {
        id,
        name: "object_" + id,
        folder: [],
        imageSrc: "",
        imageRect: { x: 0, y: 0, width: 0, height: 0 },
        resizeable: false,
        pivotPercent: { x: 0, y: 0 },
        interactionRect: { x: 0, y: 0, width: 16, height: 16 },
        inheritPropertiesFromObjectDefs: [],
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
    const defs = { ...makeNew(), ...(json as Defs) }

    defs.tilesetDefs = defs.tilesetDefs.map(t => ({
        ...t,
        folder: t.folder ?? [],
    }))

    defs.tileBrushDefs = defs.tileBrushDefs ?? []

    defs.tileBrushDefs = defs.tileBrushDefs.map(b => ({
        ...b,
        folder: b.folder ?? [],
    }))

    defs.objectDefs = defs.objectDefs.map(o => ({
        ...o,
        folder: o.folder ?? [],
        inheritPropertiesFromObjectDefs: o.inheritPropertiesFromObjectDefs ?? [],
    }))

    return defs
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


export function getTileBrushDef(defs: Defs, tileBrushDefId: ID.ID)
{
    return defs.tileBrushDefs.find(b => b.id === tileBrushDefId)
}


export function getObjectDef(defs: Defs, objectDefId: ID.ID)
{
    return defs.objectDefs.find(o => o.id === objectDefId)
}


export function getObjectPropertyDefs(
    defs: Defs,
    objectDef: DefObject)
    : Properties.DefProperties
{
    if (objectDef.inheritPropertiesFromObjectDefs.length == 0)
        return objectDef.properties

    const properties: Properties.DefProperties = []
    for (const id of objectDef.inheritPropertiesFromObjectDefs)
    {
        const inheritedObjectDef = getObjectDef(defs, id)
        if (!inheritedObjectDef)
            continue

        properties.push(...getObjectPropertyDefs(defs, inheritedObjectDef))
    }

    properties.push(...objectDef.properties)
    return properties
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


export function getTileBrushData(
    brush: DefTileBrush,
    tileIndex: number)
    : DefTileBrush["tiles"][number]
{
    const data = brush.tiles[tileIndex.toString()]
    if (data === undefined)
        return {
            type: "rect",
            connections: [
                false, false, false,
                false, false, false,
                false, false, false,
            ],
            neighbors: [
                "rect",
                "rect",
                "rect",
                "rect",
            ]
        }
        
    return data
}


export function setTileBrushData(
    brush: DefTileBrush,
    tileIndex: number,
    data: DefTileBrush["tiles"][number])
    : DefTileBrush
{
    const key = tileIndex.toString()

    const tiles = {
        ...brush.tiles,
        [key]: data,
    }

    if (data.connections.every(c => !c))
        delete tiles[key]

    return {
        ...brush,
        tiles,
    }
}


export function getTileBrushTopmostLeftmostTile(
    defs: Defs,
    brush: DefTileBrush)
    : number | undefined
{
    let lowestIndex = undefined
    for (const key of Object.keys(brush.tiles))
    {
        const index = parseInt(key)
        if (lowestIndex === undefined || index < lowestIndex)
            lowestIndex = index
    }

    return lowestIndex
}


export function getTileBrushDefaultTile(
    defs: Defs,
    brush: DefTileBrush)
    : number | undefined
{
    const tile = getMatchingTileInTileBrush(
        defs, brush,
        [false, false, false,
        false, true, false,
        false, false, false])

    if (tile !== undefined)
        return tile

    for (const key of Object.keys(brush.tiles))
        return parseInt(key)

    return undefined
}


export function isTileInTileBrush(
    defs: Defs,
    brush: DefTileBrush,
    tileIndex: number)
    : boolean
{
    const data = getTileBrushData(brush, tileIndex)
    if (data === undefined)
        return false

    return data.connections.some(c => c)
}


export function getMatchingTileInTileBrush(
    defs: Defs,
    brush: DefTileBrush,
    connections: DefTileBrush["tiles"][string]["connections"])
    : number | undefined
{
    const matches: { score: number, tileIndex: number }[] = []

    for (const [key, value] of Object.entries(brush.tiles))
    {
        // Prioritize 4-way connection
        if ([1, 3, 5, 7].some(c => connections[c] !== value.connections[c]))
            continue

        let score = 0

        for (const c of [0, 2, 6, 8])
        {
            if (connections[c] === value.connections[c])
                score++
        }

        const tileIndex = parseInt(key)
        matches.push({
            score,
            tileIndex,
        })
    }

    if (matches.length == 0)
        return undefined

    matches.sort((a, b) => b.score - a.score)
    return matches[0].tileIndex
}


export function getLayerDefIconElement(layerDef: DefLayer): React.ReactNode | null
{
    return layerDef.type == "tile" ? "🧱" :
        layerDef.type == "object" ? "🍎" :
        "?"
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
                draggable="false"
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


export function getTileBrushDefIconElement(defs: Defs, tileBrushDef: DefTileBrush): React.ReactNode | null
{
    const tileset = getTileset(defs, tileBrushDef.tilesetDefId)
    if (!tileset)
        return null

    const topmostLeftmostTile = getTileBrushTopmostLeftmostTile(defs, tileBrushDef)
    if (topmostLeftmostTile === undefined)
        return null

    const tilePx = getPixelForTileIndex(tileset, topmostLeftmostTile)
    
    const image = Images.getImageLazy(tileset.imageSrc)
    if (!image)
        return <span/>

    return <div style={{
        objectFit: "contain",
        display: "inline-block",
    }}>
        <div style={{
            width: Math.min(48, tileset.width - tilePx.x) + "px",
            height: Math.min(48, tileset.height - tilePx.y) + "px",
            overflow: "hidden",
        }}>
            <img
                draggable="false"
                src={ image.element.src }
                style={{
                    marginLeft: (-tilePx.x) + "px",
                    marginTop: (-tilePx.y) + "px",
            }}/>
        </div>
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
                draggable="false"
                src={ image.element.src }
                style={{
                    marginLeft: (-objectDef.imageRect.x) + "px",
                    marginTop: (-objectDef.imageRect.y) + "px",
            }}/>
        </div>
    </div>
}