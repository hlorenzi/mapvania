import * as ID from "./id"
import * as Defs from "./defs"
import * as MathUtils from "../util/mathUtils"
import * as Properties from "./properties"
import { global } from "../global"


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


export function getDefaultCameraPosition(map: Map): MathUtils.Point
{
    for (const room of Object.values(map.rooms))
    {
        return {
            x: room.x + room.width / 2,
            y: room.y + room.height / 2,
        }
    }
    
    return { x: 0, y: 0 }
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


export function cloneRooms(
    map: Map,
    roomsToBeCloned: Room[],
    modifyRoom?: (clonedRoom: Room) => Room)
    : { map: Map, newIds: ID.ID[] }
{
    if (roomsToBeCloned.length === 0)
        return { map, newIds: [] }
    
    let nextIDs = map.nextIDs

    const rooms = { ...map.rooms }
    const clonedRoomIds: ID.ID[] = []

    for (const room of roomsToBeCloned)
    {
        const [newNextIDs, clonedRoomId] = ID.getNextID(nextIDs)
        nextIDs = newNextIDs

        let clonedRoom: Room = {
            ...room,
            id: clonedRoomId,
            layers: { ...room.layers },
        }

        clonedRoomIds.push(clonedRoomId)

        for (const layer of Object.values(clonedRoom.layers))
        {
            if (layer.type == "object")
            {
                const newLayer: LayerObject = {
                    ...layer,
                    objects: {},
                }

                for (const obj of Object.values(layer.objects))
                {
                    const [newNextIDs, clonedObjId] = ID.getNextID(nextIDs)
                    nextIDs = newNextIDs

                    const newObject: Obj = {
                        ...obj,
                        id: clonedObjId,
                    }

                    newLayer.objects[newObject.id] = newObject
                }

                clonedRoom.layers[newLayer.layerDefId] = newLayer
            }
        }
        
        if (modifyRoom)
            clonedRoom = modifyRoom(clonedRoom)

        rooms[clonedRoomId] = clonedRoom
    }
    
    map = {
        ...map,
        nextIDs,
        rooms,
    }

    return { map, newIds: clonedRoomIds }
}


export function cloneObjects(
    map: Map,
    roomId: ID.ID,
    layerId: ID.ID,
    objsToBeCloned: Obj[],
    modifyObj?: (newObj: Obj) => Obj)
    : { map: Map, newIds: ID.ID[] }
{
    let layer = getRoomLayer(map, roomId, layerId)
    if (layer?.type !== "object")
        return { map, newIds: [] }

    let nextIDs = map.nextIDs
    const clonedObjIds: ID.ID[] = []

    for (const obj of objsToBeCloned)
    {
        const [newNextIDs, clonedObjId] = ID.getNextID(nextIDs)
        nextIDs = newNextIDs

        clonedObjIds.push(clonedObjId)
    
        let clonedObj: Obj = {
            ...obj,
            id: clonedObjId,
        }

        if (modifyObj)
            clonedObj = modifyObj(clonedObj)
    
        layer = {
            ...layer,
            objects: {
                ...layer.objects,
                [clonedObjId]: clonedObj,
            }
        }
    }

    map = {
        ...map,
        nextIDs,
    }

    map = setRoomLayer(map, roomId, layer.layerDefId, layer)

    return { map, newIds: clonedObjIds }
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
    const room = getRoom(map, roomId)
    if (!room)
        return map

    return setRoom(map, roomId, {
        ...room,
        layers: {
            ...room.layers,
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
            return setRoom(map, stageId, {
                ...room,
                layers: {
                    ...room.layers,
                    [layerDefId]: {
                        type: "tile",
                        layerDefId,
                        tileField: makeTileFieldForArea(
                            layerDef.gridCellWidth,
                            layerDef.gridCellHeight,
                            room.width,
                            room.height)
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
                        type: "object",
                        layerDefId,
                        objects: {},
                    }
                }
            })
        }
    }
}


export function makeTileField(
    widthInTiles: number,
    heightInTiles: number)
    : TileField
{
    return {
        tiles: new Array<Tile | undefined>(widthInTiles * heightInTiles)
            .fill(undefined),

        width: widthInTiles,
        height: heightInTiles,
    }
}


export function makeTileFieldForArea(
    gridCellWidth: number,
    gridCellHeight: number,
    areaWidth: number,
    areaHeight: number)
    : TileField
{
    const widthInTiles  = Math.ceil(areaWidth  / gridCellWidth)
    const heightInTiles = Math.ceil(areaHeight / gridCellHeight)

    return makeTileField(widthInTiles, heightInTiles)
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


export function getTileFieldCenter(tileField: TileField): { x: number, y: number }
{
    return {
        x: Math.floor(tileField.width / 2),
        y: Math.floor(tileField.height / 2),
    }
}


export function *enumerateTileFieldCellsCentered(tileField: TileField): Generator<{ tile: Tile | undefined, x: number, y: number }, void, void>
{
    const center = getTileFieldCenter(tileField)

    for (const tile of enumerateTileFieldCells(tileField))
    {
        yield {
            tile: tile.tile,
            x: tile.x - center.x,
            y: tile.y - center.y,
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


export function getBrushTileDecisionAt(
    defs: Defs.Defs,
    brush: Defs.DefTileBrush,
    tileField: TileField,
    cell: { x: number, y: number })
    : number | undefined
{
    const cellIndex = getTileFieldCellIndexForCell(
        tileField,
        cell)

    if (cellIndex === undefined)
        return undefined

    const tile = tileField.tiles[cellIndex]
    if (!tile)
        return undefined

    const connections: Defs.DefTileBrush["tiles"][string]["connections"] = [
        false, false, false,
        false, false, false,
        false, false, false,
    ]

    for (let cx = -1; cx <= 1; cx++)
    for (let cy = -1; cy <= 1; cy++)
    {
        const neighborCell = { x: cell.x + cx, y: cell.y + cy }
        const neighborCellIndex = getTileFieldCellIndexForCell(
            tileField,
            neighborCell)

        if (neighborCellIndex === undefined)
        {
            if (global.editors.mapEditing.tileBrushEdgeBehavior === "connectAlways")
                connections[(cx + 1) + (cy + 1) * 3] = true

            continue
        }

        const neighborTile = tileField.tiles[neighborCellIndex]
        if (!neighborTile || neighborTile.tilesetDefId !== tile.tilesetDefId)
            continue

        if (Defs.isTileInTileBrush(defs, brush, neighborTile.tileId))
            connections[(cx + 1) + (cy + 1) * 3] = true
    }

    return Defs.getMatchingTileInTileBrush(defs, brush, connections) ??
        Defs.getTileBrushDefaultTile(defs, brush)
}


export function getRoomObject(
    map: Map,
    roomId: ID.ID,
    layerDefId: ID.ID,
    objectId: ID.ID)
    : Obj | undefined
{
    const room = getRoom(map, roomId)
    if (!room)
        return undefined

    const layer = room.layers[layerDefId]
    if (!layer || layer.type !== "object")
        return undefined

    return layer.objects[objectId]
}


export function setRoomObject(
    map: Map,
    roomId: ID.ID,
    layerDefId: ID.ID,
    objectId: ID.ID,
    object: Obj)
    : Map
{
    const room = getRoom(map, roomId)
    if (!room)
        return map

    const layer = room.layers[layerDefId]
    if (!layer || layer.type !== "object")
        return map
    
    return setRoomLayer(map, roomId, layerDefId, {
        ...layer,
        objects: {
            ...layer.objects,
            [objectId]: object,
        },
    })
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
    
    if (xOffsetInPx == 0 &&
        yOffsetInPx == 0 &&
        room.width == newWidthInPx &&
        room.height == newHeightInPx)
        return map

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


