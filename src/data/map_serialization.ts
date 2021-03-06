import * as ID from "./id"
import * as Defs from "./defs"
import * as Map from "./map"
import * as MathUtils from "../util/mathUtils"
import * as Properties from "./properties"


export interface SerializedMap extends Omit<Map.Map, "rooms">
{
    type: "map"
    version: 2
    tilesetRanges: TilesetRange[]
    rooms: SerRoom[]
}


export interface TilesetRange
{
    tilesetDefId: ID.ID
    tilesetDefName: string
    start: number
    end: number
    width: number
    height: number
}


export interface SerRoom extends Omit<Map.Room, "layers">
{
    layers: SerLayer[]
}


export type SerLayer =
    SerLayerTile |
    SerLayerObject


export interface SerLayerTile extends
    Omit<Map.LayerTile, "tileField">
{
    layerDefName: string
    widthInTiles: number
    heightInTiles: number
    tiles: number[]
}


export interface SerLayerObject extends
    Omit<Map.LayerObject, "objects">
{
    layerDefName: string
    objects: SerObject[]
}


export interface SerObject extends Map.Obj
{
    objectDefName: string
}


export function serialize(
    defs: Defs.Defs,
    map: Map.Map)
    : SerializedMap
{
    const serMap: SerializedMap = {
        type: "map",
        version: 2,
        nextIDs: map.nextIDs,
        tilesetRanges: [],
        rooms: [],
    }

    serMap.rooms = Object.values(map.rooms)
        .map(r => serializeRoom(defs, serMap, r))

    serMap.rooms.sort((a, b) => ID.compareIDs(a.id, b.id))

    return serMap
}


export function serializeRoom(
    defs: Defs.Defs,
    serMap: SerializedMap,
    room: Map.Room)
    : SerRoom
{
    const serRoom: SerRoom = {
        id: room.id,
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
        layers: [],
    }

    serRoom.layers = Object.values(room.layers)
        .map(l => serializeLayer(defs, serMap, l))

    serRoom.layers.sort((a, b) => ID.compareIDs(a.layerDefId, b.layerDefId))

    return serRoom
}


export function serializeLayer(
    defs: Defs.Defs,
    serializedMap: SerializedMap,
    layer: Map.Layer)
    : SerLayer
{
    switch (layer.type)
    {
        case "tile":
            return serializeLayerTile(defs, serializedMap, layer)
        case "object":
            return serializeLayerObject(defs, serializedMap, layer)
    }
}


export function serializeLayerTile(
    defs: Defs.Defs,
    serMap: SerializedMap,
    layer: Map.LayerTile)
    : SerLayerTile
{
    const layerDef = Defs.getLayerDef(defs, layer.layerDefId)

    const serLayer: SerLayerTile = {
        type: "tile",
        layerDefId: layer.layerDefId,
        layerDefName: layerDef?.name ?? "",
        widthInTiles: layer.tileField.width,
        heightInTiles: layer.tileField.height,
        tiles: [],
    }
    
    for (let i = 0; i < layer.tileField.tiles.length; i++)
    {
        const tile = layer.tileField.tiles[i]
        if (!tile)
        {
            serLayer.tiles.push(-1)
            continue
        }

        const tilesetRange = serMap.tilesetRanges
            .find(tr => tr.tilesetDefId === tile.tilesetDefId)

        if (tilesetRange)
        {
            serLayer.tiles.push(tile.tileId + tilesetRange.start)
            continue
        }

        const tilesetDef = Defs.getTileset(defs, tile.tilesetDefId)
        if (!tilesetDef)
        {
            serLayer.tiles.push(-1)
            continue
        }

        const numTilesInTileset = Defs.getTotalTileNumber(tilesetDef)
        if (tile.tileId < 0 || tile.tileId >= numTilesInTileset)
        {
            serLayer.tiles.push(-1)
            continue
        }

        const start =
            serMap.tilesetRanges.length == 0 ? 0 :
            serMap.tilesetRanges[serMap.tilesetRanges.length - 1].end

        const newTilesetRange: TilesetRange = {
            tilesetDefId: tile.tilesetDefId,
            tilesetDefName: tilesetDef.name,
            start,
            end: start + numTilesInTileset,
            width: tilesetDef.width,
            height: tilesetDef.height,
        }

        serMap.tilesetRanges.push(newTilesetRange)
        serLayer.tiles.push(start + tile.tileId)
    }

    return serLayer
}


export function serializeLayerObject(
    defs: Defs.Defs,
    serMap: SerializedMap,
    layer: Map.LayerObject)
    : SerLayerObject
{
    const layerDef = Defs.getLayerDef(defs, layer.layerDefId)

    const serLayer: SerLayerObject = {
        type: "object",
        layerDefId: layer.layerDefId,
        layerDefName: layerDef?.name ?? "",
        objects: [],
    }

    serLayer.objects = Object.values(layer.objects)
        .map(o => serializeObject(defs, serMap, o)!)
        .filter(o => !!o)

    serLayer.objects.sort((a, b) => ID.compareIDs(a.id, b.id))

    return serLayer
}


export function serializeObject(
    defs: Defs.Defs,
    serMap: SerializedMap,
    object: Map.Obj)
    : SerObject | null
{
    const objectDef = Defs.getObjectDef(defs, object.objectDefId)
    if (!objectDef)
        return null

    const propertyDefs = Defs.getObjectPropertyDefs(defs, objectDef)

    const serObject: SerObject = {
        id: object.id,
        objectDefId: object.objectDefId,
        objectDefName: objectDef?.name ?? "",
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
        properties: Properties.serializeValues(
            propertyDefs,
            object.properties),
    }

    return serObject
}


export function deserialize(
    defs: Defs.Defs,
    serMap: SerializedMap)
    : Map.Map
{
    if (serMap.type !== "map")
        throw "not a serialized map"

    if (serMap.version <= 1)
        return { ...Map.makeNew(), ...serMap as any }

    const map: Map.Map = {
        nextIDs: serMap.nextIDs,
        rooms: {},
    }

    for (const serRoom of serMap.rooms)
    {
        const room = deserializeRoom(defs, serMap, map, serRoom)
        if (!room)
            continue

        map.rooms[room.id] = room
    }

    return map
}


export function deserializeRoom(
    defs: Defs.Defs,
    serMap: SerializedMap,
    map: Map.Map,
    serRoom: SerRoom)
    : Map.Room
{
    const room: Map.Room = {
        id: serRoom.id,
        x: serRoom.x,
        y: serRoom.y,
        width: serRoom.width,
        height: serRoom.height,
        layers: {},
    }

    for (const serLayer of serRoom.layers)
    {
        const layer = deserializeLayer(defs, serMap, map, room, serLayer)
        if (!layer)
            continue

        room.layers[layer.layerDefId] = layer
    }

    return room
}


export function deserializeLayer(
    defs: Defs.Defs,
    serMap: SerializedMap,
    map: Map.Map,
    room: Map.Room,
    serLayer: SerLayer)
    : Map.Layer | null
{
    switch (serLayer.type)
    {
        case "tile":
            return deserializeLayerTile(defs, serMap, map, room, serLayer)
        case "object":
            return deserializeLayerObject(defs, serMap, map, room, serLayer)
    }
}


export function deserializeLayerTile(
    defs: Defs.Defs,
    serMap: SerializedMap,
    map: Map.Map,
    room: Map.Room,
    serLayer: SerLayerTile)
    : Map.LayerTile | null
{
    const layerDef = Defs.getLayerDef(defs, serLayer.layerDefId)
    if (!layerDef || layerDef.type !== "tile")
        return null

    const layer: Map.LayerTile = {
        type: "tile",
        layerDefId: serLayer.layerDefId,
        tileField: Map.makeTileFieldForArea(
            layerDef.gridCellWidth,
            layerDef.gridCellHeight,
            room.width,
            room.height),
    }

    for (let y = 0; y < layer.tileField.height; y++)
    {
        for (let x = 0; x < layer.tileField.width; x++)
        {
            const i = y * layer.tileField.width + x
            if (i < 0 || i >= serLayer.tiles.length)
                continue

            const serIndex = serLayer.tiles[i]
            const tilesetRange = serMap.tilesetRanges
                .find(tr => serIndex >= tr.start && serIndex < tr.end)

            if (!tilesetRange)
                continue

            const tilesetDef = Defs.getTileset(defs, tilesetRange.tilesetDefId)
            if (!tilesetDef)
                continue

            layer.tileField.tiles[i] = {
                tilesetDefId: tilesetRange.tilesetDefId,
                tileId: serIndex - tilesetRange.start,
            }
        }
    }

    return layer
}


export function deserializeLayerObject(
    defs: Defs.Defs,
    serMap: SerializedMap,
    map: Map.Map,
    room: Map.Room,
    serLayer: SerLayerObject)
    : Map.LayerObject | null
{
    const layerDef = Defs.getLayerDef(defs, serLayer.layerDefId)
    if (!layerDef || layerDef.type !== "object")
        return null

    const layer: Map.LayerObject = {
        type: "object",
        layerDefId: serLayer.layerDefId,
        objects: {},
    }

    for (const serObject of serLayer.objects)
    {
        const obj = deserializeObject(defs, serMap, map, room, serObject)
        if (!obj)
            continue

        layer.objects[obj.id] = obj
    }

    return layer
}


export function deserializeObject(
    defs: Defs.Defs,
    serMap: SerializedMap,
    map: Map.Map,
    room: Map.Room,
    serObject: SerObject)
    : Map.Obj | null
{
    const objectDef = Defs.getObjectDef(defs, serObject.objectDefId)
    if (!objectDef)
        return null

    const propertyDefs = Defs.getObjectPropertyDefs(defs, objectDef)

    const object: Map.Obj = {
        id: serObject.id,
        objectDefId: serObject.objectDefId,
        x: serObject.x,
        y: serObject.y,
        width: serObject.width,
        height: serObject.height,
        properties: Properties.deserializeValues(
            propertyDefs,
            serObject.properties),
    }

    if (!objectDef.resizeable)
    {
        object.width = objectDef.interactionRect.width
        object.height = objectDef.interactionRect.height
    }

    return object
}