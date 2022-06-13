import * as ID from "./id"
import * as Defs from "./defs"
import * as MathUtils from "../util/mathUtils"
import * as Properties from "./properties"


export interface Map
{
    nextIDs: ID.NextIDs
    rooms: { [roomId: ID.ID]: Room }
}


export interface Room
{
    id: ID.ID

    // The top-left position within a map, in pixels
    x: number
    y: number

    // The dimensions of the room, in pixels
    width: number
    height: number

    layers: { [layerId: ID.ID]: Layer }
}


export type Layer =
    LayerTile |
    LayerObject


export interface LayerCommon
{
    layerDefId: ID.ID
}


export interface LayerTile extends LayerCommon
{
    type: "tile"
    tileField: TileField
}


export interface LayerObject extends LayerCommon
{
    type: "object"
    objects: { [id: ID.ID]: Obj }
}


export interface TileField
{
    tiles: (Tile | undefined)[]
    width: number
    height: number
}


export interface Tile
{
    tilesetDefId: ID.ID
    tileId: number
}


export interface Obj
{
    id: ID.ID
    objectDefId: ID.ID

    x: number
    y: number
    width: number
    height: number

    properties: Properties.PropertyValues
}


export function makeNew(): Map
{
    let [nextIDs, newID] = ID.getNextID(ID.makeNewNextIDs())

    return {
        nextIDs: nextIDs,
        rooms: {
            [newID]: {
                id: newID,
                x: 0,
                y: 0,
                width: 16 * 18,
                height: 16 * 10,
                layers: {},
            },
        },
    }
}


export function stringify(map: Map): string
{
    return JSON.stringify({
        ...map,
        type: "map",
        version: 1,
    },
    undefined, 2)
}


export function parse(data: string): Map
{
    const json = JSON.parse(data)
    return { ...makeNew(), ...(json as Map) }
}


export function getRoom(map: Map, roomId: ID.ID): Room | undefined
{
    return map.rooms[roomId]
}


export function setRoom(map: Map, roomId: ID.ID, room: Room): Map
{
    return {
        ...map,
        rooms: {
            ...map.rooms,
            [roomId]: room,
        },
    }
}


export function getRoomLayer(map: Map, roomId: ID.ID, layerDefId: ID.ID): Layer | undefined
{
    const room = getRoom(map, roomId)
    if (!room)
        return undefined

    return room.layers[layerDefId]
}


export function setRoomLayer(
    map: Map,
    roomId: ID.ID,
    layerId: ID.ID,
    layer: Layer)
    : Map
{
    const stage = getRoom(map, roomId)
    if (!stage)
        return map

    return setRoom(map, roomId, {
        ...stage,
        layers: {
            ...stage.layers,
            [layerId]: layer,
        },
    })
}


export function ensureRoomLayer(defs: Defs.Defs, map: Map, stageId: ID.ID, layerDefId: ID.ID): Map
{
    const room = getRoom(map, stageId)
    if (!room)
        return map

    const layerDef = Defs.getLayerDef(defs, layerDefId)
    if (!layerDef)
        return map

    const layer = getRoomLayer(map, stageId, layerDefId)
    if (layer)
        return map

    switch (layerDef.type)
    {
        case "tile":
        {
            const widthInTiles  = Math.ceil(room.width  / layerDef.gridCellWidth)
            const heightInTiles = Math.ceil(room.height / layerDef.gridCellHeight)

            return setRoom(map, stageId, {
                ...room,
                layers: {
                    ...room.layers,
                    [layerDefId]: {
                        layerDefId,
                        type: "tile",
                        tileField: {
                            tiles: new Array<Tile>(widthInTiles * heightInTiles).fill({ tileId: -1, tilesetDefId: "" }),
                            width: widthInTiles,
                            height: heightInTiles,
                        }
                    }
                }
            })
        }

        case "object":
        {
            return setRoom(map, stageId, {
                ...room,
                layers: {
                    ...room.layers,
                    [layerDefId]: {
                        layerDefId,
                        type: "object",
                        objects: {},
                    }
                }
            })
        }
    }

    return map
}


export function makeTileField(widthInTiles: number, heightInTiles: number): TileField
{
    return {
        tiles: new Array<Tile>(widthInTiles * heightInTiles).fill({ tileId: -1, tilesetDefId: "" }),
        width: widthInTiles,
        height: heightInTiles,
    }
}


export function getTileFieldCellIndexForCell(tileField: TileField, cell: { x: number, y: number })
{
    if (cell.x < 0 || cell.x >= tileField.width || cell.y < 0 || cell.y >= tileField.height)
        return undefined
    
    return cell.y * tileField.width + cell.x
}


export function *enumerateTileFieldCells(tileField: TileField): Generator<{ tile: Tile | undefined, x: number, y: number }, void, void>
{
    for (let i = 0; i < tileField.tiles.length; i++)
    {
        const x = i % tileField.width
        const y = Math.floor(i / tileField.width)
        yield { tile: tileField.tiles[i], x, y }
    }
}


export function *enumerateTileFieldCellsCentered(tileField: TileField): Generator<{ tile: Tile | undefined, x: number, y: number }, void, void>
{
    for (const tile of enumerateTileFieldCells(tileField))
    {
        yield {
            tile: tile.tile,
            x: tile.x - Math.floor(tileField.width / 2),
            y: tile.y - Math.floor(tileField.height / 2),
        }
    }
}


export function resizeTileField(
    tileField: TileField,
    xOffsetInTiles: number,
    yOffsetInTiles: number,
    newWidthInTiles: number,
    newHeightInTiles: number)
    : TileField
{
    const newTileField = makeTileField(newWidthInTiles, newHeightInTiles)

    for (let y = 0; y < tileField.height; y++)
    {
        for (let x = 0; x < tileField.width; x++)
        {
            const oldCell = getTileFieldCellIndexForCell(tileField, { x, y })
            if (oldCell === undefined)
                continue

            const newX = x - xOffsetInTiles
            const newY = y - yOffsetInTiles
    
            const newCell = getTileFieldCellIndexForCell(newTileField, { x: newX, y: newY })
            if (newCell === undefined)
                continue

            newTileField.tiles[newCell] = tileField.tiles[oldCell]
        }
    }

    return newTileField
}


export function makeObject(
    defs: Defs.Defs,
    map: Map,
    objectDefId: ID.ID)
    : Obj
{
    const objectDef = defs.objectDefs.find(o => o.id === objectDefId)!
    const propertyDefs = Defs.getObjectPropertyDefs(defs, objectDef)

    return {
        id: "",
        objectDefId,
        x: 0,
        y: 0,
        width: objectDef.interactionRect.width,
        height: objectDef.interactionRect.height,
        properties: Properties.makeNewValues(propertyDefs),
    }
}


export function resizeRoom(
    defs: Defs.Defs,
    map: Map,
    roomId: ID.ID,
    xOffsetInPx: number,
    yOffsetInPx: number,
    newWidthInPx: number,
    newHeightInPx: number)
    : Map
{
    const room = map.rooms[roomId]

    const newLayers: typeof room.layers = {}

    for (const layer of Object.values(room.layers))
    {
        if (layer.type === "tile")
        {
            const layerDef = defs.layerDefs.find(l => l.id === layer.layerDefId)
            if (!layerDef)
                continue
            
            const xOffsetInTiles = Math.floor(xOffsetInPx / layerDef.gridCellWidth)
            const yOffsetInTiles = Math.floor(yOffsetInPx / layerDef.gridCellHeight)
            const widthInTiles  = Math.ceil(newWidthInPx  / layerDef.gridCellWidth)
            const heightInTiles = Math.ceil(newHeightInPx / layerDef.gridCellHeight)

            const newTileField = resizeTileField(
                layer.tileField,
                xOffsetInTiles, yOffsetInTiles,
                widthInTiles, heightInTiles)

            newLayers[layer.layerDefId] = {
                ...layer,
                tileField: newTileField,
            }
        }

        else if (layer.type === "object")
        {
            const newObjects = { ...layer.objects }
            for (const object of Object.values(newObjects))
            {
                const newObject = {
                    ...object,
                    x: object.x - xOffsetInPx,
                    y: object.y - yOffsetInPx,
                }

                newObjects[object.id] = newObject
            }

            newLayers[layer.layerDefId] = {
                ...layer,
                objects: newObjects,
            }
        }
    }

    const newRoom: Room = {
        ...room,
        x: room.x + xOffsetInPx,
        y: room.y + yOffsetInPx,
        width: newWidthInPx,
        height: newHeightInPx,
        layers: newLayers,
    }

    return {
        ...map,
        rooms: {
            ...map.rooms,
            [newRoom.id]: newRoom,
        }
    }
}


