import * as React from "react"
import { RefreshToken } from "../util/refreshToken"
import * as ID from "./id"
import * as Filesystem from "./filesystem"
import * as Hierarchy from "./hierarchy"
import * as Images from "./images"
import * as Properties from "./properties"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"
import * as JsonUtils from "../util/json"


export interface Defs
{
    nextIDs: ID.NextIDs
    generalDefs: DefGeneral
    mapDef: DefMap
    roomDef: DefRoom
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

    jsonExportType: "standard" | "merge-friendly"
    jsonMinimize: boolean
    jsonUseTrailingCommas: boolean
    jsonUseBareIdentifiers: boolean
}


export interface DefMap
{
    properties: Properties.DefProperties
}


export interface DefRoom
{
    inheritPropertiesFromMap: boolean
    properties: Properties.DefProperties
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

    tileAttributes: {
        [stringifiedTileIndex: string]: ID.ID[]
    }
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
        [stringifiedTileIndex: string]: BrushTileData
    }
}


export enum BrushTileType
{
    None = 0,
    Full = 1,

    DiagonalStart = 2,
    DiagonalUL = 2,
    DiagonalUR = 3,
    DiagonalDL = 4,
    DiagonalDR = 5,
    DiagonalEnd = 5,
}


export type BrushTileData =
{
    connections: BrushTileConnections
}


export type BrushTileConnections =
[
    BrushTileType, BrushTileType, BrushTileType,
    BrushTileType, BrushTileType, BrushTileType,
    BrushTileType, BrushTileType, BrushTileType,
]


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

            jsonExportType: "standard",
            jsonMinimize: false,
            jsonUseTrailingCommas: false,
            jsonUseBareIdentifiers: false,
        },
        mapDef: {
            properties: [],
        },
        roomDef: {
            inheritPropertiesFromMap: false,
            properties: [],
        },
        layerDefs: [],
        tilesetDefs: [],
        tileAttributeDefs: [],
        tileBrushDefs: [],
        objectDefs: [],
    }
}


export function getRoomPropertyDefs(
    defs: Defs)
    : Properties.DefProperties
{
    if (!defs.roomDef.inheritPropertiesFromMap)
        return defs.roomDef.properties

    const properties: Properties.DefProperties = []
    properties.push(...defs.mapDef.properties)
    properties.push(...defs.roomDef.properties)
    return properties
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
        tileAttributes: {},
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
    const key = tileIndex.toString()

    const list = tileAttributes as { [s: string]: string[] }

    const attrb = list[key]
    if (!attrb)
        return []

    return attrb
}


export function setTileAttributesForTile(
    tileAttributes: DefTileset["tileAttributes"],
    tileIndex: number,
    attributes: ID.ID[])
    : DefTileset["tileAttributes"]
{
    const key = tileIndex.toString()

    let newAttrb = tileAttributes as { [s: string]: string[] }
    newAttrb = { ...newAttrb }

    if (attributes.length === 0)
    {
        delete newAttrb[key]
    }
    else
    {
        newAttrb[key] = attributes
    }

    return newAttrb
}


export function getTileBrushData(
    brush: DefTileBrush,
    tileIndex: number)
    : BrushTileData
{
    const data = brush.tiles[tileIndex.toString()]
    if (data === undefined)
        return {
            connections: [
                BrushTileType.None, BrushTileType.None, BrushTileType.None,
                BrushTileType.None, BrushTileType.None, BrushTileType.None,
                BrushTileType.None, BrushTileType.None, BrushTileType.None,
            ],
        }
        
    return data
}


export function setTileBrushConnection(
    brush: DefTileBrush,
    tileIndex: number,
    connection: number,
    type: BrushTileType)
    : DefTileBrush
{
    const key = tileIndex.toString()

    let data = brush.tiles[key]

    if (data && data.connections[connection] === type)
        return brush
    
    if (!data)
    {
        data = {
            connections: [
                BrushTileType.None, BrushTileType.None, BrushTileType.None,
                BrushTileType.None, BrushTileType.None, BrushTileType.None,
                BrushTileType.None, BrushTileType.None, BrushTileType.None,
            ]
        }
    }

    data = {
        ...data,
        connections: [
            ...data.connections.slice(0, connection),
            type,
            ...data.connections.slice(connection + 1),
        ] as BrushTileConnections
    }

    brush = {
        ...brush,
        tiles: {
            ...brush.tiles,
            [key]: data,
        }
    }

    if (data.connections.every(c => c === BrushTileType.None))
        delete brush.tiles[key]

    return brush
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
    brush: DefTileBrush,
    type: BrushTileType)
    : number | undefined
{
    let tile = getTileWithCenterTypeInTileBrush(
        defs,
        brush,
        type)

    if (tile !== undefined)
        return tile

    if (type !== BrushTileType.Full)
    {
        tile = getTileWithCenterTypeInTileBrush(
            defs,
            brush,
            BrushTileType.Full)
    }

    if (tile !== undefined)
        return tile

    for (const key of Object.keys(brush.tiles))
        return parseInt(key)

    return undefined
}


export function getTileTypeInTileBrush(
    defs: Defs,
    brush: DefTileBrush,
    tileIndex: number)
    : BrushTileType
{
    const data = getTileBrushData(brush, tileIndex)
    if (data === undefined)
        return BrushTileType.None

    return data.connections[4]
}


export function getTileWithCenterTypeInTileBrush(
    defs: Defs,
    brush: DefTileBrush,
    centerType: BrushTileType)
    : number | undefined
{
    const matches: { score: number, tileIndex: number }[] = []

    for (const [tileIndexKey, data] of Object.entries(brush.tiles))
    {
        const tileIndex = parseInt(tileIndexKey)

        let score = 0

        // Add score for center piece
        if (data.connections[4] === centerType)
            score += 10000

        // Add score for other connections
        for (const c of [0, 1, 2, 3, 5, 6, 7, 8])
        {
            if (data.connections[c] === BrushTileType.None)
                score += 100
        }

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


export function getMatchingTileInTileBrush(
    defs: Defs,
    brush: DefTileBrush,
    desiredConnections: BrushTileConnections)
    : number | undefined
{
    const matches: { score: number, tileIndex: number }[] = []

    for (const [tileIndexKey, data] of Object.entries(brush.tiles))
    {
        if (data.connections[4] !== desiredConnections[4])
            continue

        let score = 0

        let matched4Way = true

        // Prioritize 4-way connection
        for (const c of [1, 3, 5, 7])
        {
            if (data.connections[c] === desiredConnections[c])
            {
                score += 100000
                continue
            }

            if (desiredConnections[c] === BrushTileType.Full &&
                data.connections[c] !== BrushTileType.None)
            {
                score += 10000
                continue
            }

            if (data.connections[c] === BrushTileType.Full &&
                desiredConnections[c] !== BrushTileType.None)
            {
                score += 1000
                continue
            }

            matched4Way = false
        }

        if (!matched4Way)
            continue

        // Add score for diagonal connections
        for (const c of [0, 2, 6, 8])
        {
            if (data.connections[c] === desiredConnections[c])
                score += 1000

            else if (data.connections[c] === BrushTileType.Full &&
                desiredConnections[c] !== BrushTileType.None)
                score += 100

            else if (desiredConnections[c] === BrushTileType.Full &&
                data.connections[c] !== BrushTileType.None)
                score += 10
        }

        const tileIndex = parseInt(tileIndexKey)

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


export function getLayerDefIconElement(
    layerDef: DefLayer)
    : React.ReactNode | null
{
    return layerDef.type == "tile" ? "🧱" :
        layerDef.type == "object" ? "🍎" :
        "?"
}


export function getTilesetDefIconElement(
    basePath: string,
    tilesetDef: DefTileset)
    : React.ReactNode | null
{
    const imagePath = Filesystem.resolveRelativePath(
        basePath,
        tilesetDef.imageSrc)

    const image = Images.getImageLazy(imagePath)
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


export function getTileBrushDefIconElement(
    basePath: string,
    defs: Defs,
    tileBrushDef: DefTileBrush)
    : React.ReactNode | null
{
    const tileset = getTileset(defs, tileBrushDef.tilesetDefId)
    if (!tileset)
        return null

    const topmostLeftmostTile = getTileBrushTopmostLeftmostTile(defs, tileBrushDef)
    if (topmostLeftmostTile === undefined)
        return null

    const tilePx = getPixelForTileIndex(tileset, topmostLeftmostTile)
    
    const imagePath = Filesystem.resolveRelativePath(
        basePath,
        tileset.imageSrc)

    const image = Images.getImageLazy(imagePath)
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


export function getObjectDefIconElement(
    basePath: string,
    objectDef: DefObject)
    : React.ReactNode | null
{
    const imagePath = Filesystem.resolveRelativePath(
        basePath,
        objectDef.imageSrc)

    const image = Images.getImageLazy(imagePath)
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


export function getImageIconElement(
    basePath: string,
    relativePath: string)
    : React.ReactNode | null
{
    const imagePath = Filesystem.resolveRelativePath(
        basePath,
        relativePath)

    const image = Images.getImageLazy(imagePath)
    if (!image)
        return <span/>

    return <div style={{
        objectFit: "contain",
        display: "inline-block",
    }}>
        <div style={{
            width: Math.min(64, image.width) + "px",
            height: Math.min(64, image.height) + "px",
            overflow: "hidden",
        }}>
            <img
                draggable="false"
                src={ image.element.src }
                style={{
            }}/>
        </div>
    </div>
}