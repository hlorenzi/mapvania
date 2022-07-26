import * as ID from "./id"
import * as Defs from "./defs"
import * as Map from "./map"
import * as MathUtils from "../util/mathUtils"
import * as Properties from "./properties"
import * as JsonUtils from "../util/json"


export interface SerializedMap extends Omit<Map.Map, "rooms">
{
    type: "map"
    version: 3
    rooms: SerRoom[]
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
    tiles: (string | number)[]
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


export function stringify(
    defs: Defs.Defs,
    serMap: SerializedMap)
    : string
{
    const isMergeFriendly = defs.generalDefs.jsonExportType === "merge-friendly"

    const jsonGetOptions: JsonUtils.GetStringifyOptions = (path, parent, value) =>
    {
        if (isMergeFriendly)
        {
            if (path[0] === "nextIDs")
                return {
                    spacedFields: true,
                }
        }

        return {}
    }

    return JsonUtils.stringify(
        serMap,
        {
            sortFields: isMergeFriendly,
            minimize: defs.generalDefs.jsonMinimize,
            useTrailingCommas: defs.generalDefs.jsonUseTrailingCommas,
            useBareIdentifiers: defs.generalDefs.jsonUseBareIdentifiers,
        },
        jsonGetOptions)
}


export function serialize(
    defs: Defs.Defs,
    map: Map.Map)
    : SerializedMap
{
    const serMap: SerializedMap = {
        type: "map",
        version: 3,
        nextIDs: map.nextIDs,
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

    let currentTilesetId = ""
    
    for (let i = 0; i < layer.tileField.tiles.length; i++)
    {
        const tile = layer.tileField.tiles[i]
        if (!tile)
        {
            serLayer.tiles.push(-1)
            continue
        }

        if (tile.tilesetDefId !== currentTilesetId)
        {
            currentTilesetId = tile.tilesetDefId
            serLayer.tiles.push(tile.tilesetDefId)
        }

        serLayer.tiles.push(tile.tileId)
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


export function parse(
    serMapText: string)
    : SerializedMap
{
    return JsonUtils.parse(serMapText)
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

    let currentTilesetId = ""
    let tileFieldIndex = 0

    for (let i = 0; i < serLayer.tiles.length; i++)
    {
        const serIndexOrId = serLayer.tiles[i]
        
        if (typeof serIndexOrId === "string")
        {
            currentTilesetId = serIndexOrId
        }
        else
        {
            tileFieldIndex++

            const tilesetDef = Defs.getTileset(defs, currentTilesetId)
            if (!tilesetDef)
                continue

            if (serIndexOrId < 0 ||
                serIndexOrId >= Defs.getTotalTileNumber(tilesetDef))
                continue

            if (tileFieldIndex - 1 >= layer.tileField.tiles.length)
                continue

            layer.tileField.tiles[tileFieldIndex - 1] = {
                tilesetDefId: currentTilesetId,
                tileId: serIndexOrId,
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