import * as ID from "./id"
import * as Defs from "./defs"
import * as MathUtils from "../util/mathUtils"
import * as Properties from "./properties"
import { global } from "../global"


export interface Map
{
    nextIDs: ID.NextIDs
    rooms: { [roomId: ID.ID]: Room }
    properties: Properties.PropertyValues
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

    properties: Properties.PropertyValues
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


export function makeNew(defs: Defs.Defs): Map
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
                properties: Properties.makeNewValues(Defs.getRoomPropertyDefs(defs)),
            },
        },
        properties: Properties.makeNewValues(defs.mapDef.properties),
    }
}


export function getDefaultCameraPosition(map: Map): MathUtils.Point
{
    // Find room at the map's origin
    for (const room of Object.values(map.rooms))
    {
        if (room.x <= 0 &&
            room.y <= 0 &&
            room.x + room.width > 0 &&
            room.y + room.height > 0)
        {
            return {
                x: room.x + room.width / 2,
                y: room.y + room.height / 2,
            }
        }
    }

    // Find room near the map's origin
    let minDistSqr = Infinity
    let position = { x: 0, y: 0 }
    for (const room of Object.values(map.rooms))
    {
        const cx = room.x + room.width / 2
        const cy = room.y + room.height / 2
        const distSqr = cx * cx + cy * cy

        if (distSqr < minDistSqr)
        {
            minDistSqr = distSqr
            position = { x: cx, y: cy }
        }
    }
    
    return position
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

    if (room.layers[layerId] === layer)
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


export function getTile(
    layer: LayerTile,
    cell: { x: number, y: number })
    : Tile | undefined
{
    const cellIndex = getTileFieldCellIndexForCell(layer.tileField, cell)
    if (cellIndex === undefined)
        return undefined

    return layer.tileField.tiles[cellIndex]
}


export function setTile(
    layer: LayerTile,
    cell: { x: number, y: number },
    tile: Tile | undefined)
    : LayerTile
{
    const cellIndex = getTileFieldCellIndexForCell(layer.tileField, cell)
    if (cellIndex === undefined)
        return layer

    const originalTile = layer.tileField.tiles[cellIndex]

    if (originalTile === undefined &&
        tile === undefined)
        return layer

    if (originalTile !== undefined &&
        tile !== undefined &&
        originalTile.tileId === tile.tileId &&
        originalTile.tilesetDefId === tile.tilesetDefId)
        return layer

    return {
        ...layer,
        tileField: {
            ...layer.tileField,
            tiles: [
                ...layer.tileField.tiles.slice(0, cellIndex),
                tile,
                ...layer.tileField.tiles.slice(cellIndex + 1),
            ]
        }
    }
}


export function isNewTileOfDifferentBrushType(
    layer: LayerTile,
    brush: Defs.DefTileBrush,
    cell: { x: number, y: number },
    tile: Tile | undefined)
    : boolean
{
    const cellIndex = getTileFieldCellIndexForCell(layer.tileField, cell)
    if (cellIndex === undefined)
        return false

    const origTile = layer.tileField.tiles[cellIndex]

    if (origTile &&
        tile &&
        origTile.tilesetDefId === tile.tilesetDefId)
    {
        const origType = Defs.getTileTypeInTileBrush(
            brush,
            origTile.tileId)

        const newType = Defs.getTileTypeInTileBrush(
            brush,
            tile.tileId)

        if (origType === newType)
            return false
    }

    return true
}


export function isNewTileOfDifferentBrushConnections(
    layer: LayerTile,
    brush: Defs.DefTileBrush,
    cell: { x: number, y: number },
    tile: Tile | undefined)
    : boolean
{
    const cellIndex = getTileFieldCellIndexForCell(layer.tileField, cell)
    if (cellIndex === undefined)
        return false

    const origTile = layer.tileField.tiles[cellIndex]

    if (origTile &&
        tile &&
        origTile.tilesetDefId === tile.tilesetDefId)
    {
        const origType = Defs.getTileBrushData(
            brush,
            origTile.tileId)

        const newType = Defs.getTileBrushData(
            brush,
            tile.tileId)

        let allSame = true
        for (let c = 0; c < 9; c++)
            if (origType.connections[c] !== newType.connections[c])
                allSame = false

        return !allSame
    }

    return true
}


export function setTileIfDifferentBrushConnections(
    layer: LayerTile,
    brush: Defs.DefTileBrush,
    cell: { x: number, y: number },
    tile: Tile | undefined)
    : LayerTile
{
    const cellIndex = getTileFieldCellIndexForCell(layer.tileField, cell)
    if (cellIndex === undefined)
        return layer

    if (!isNewTileOfDifferentBrushType(layer, brush, cell, tile))
        return layer

    return setTile(layer, cell, tile)
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


export function getBrushTileTypeForMousePosition(
    brush: Defs.DefTileBrush,
    layerDef: Defs.DefLayerTile,
    mousePosInRoom: MathUtils.Point)
    : Defs.BrushTileType
{
    const cornerX = Math.floor(
        (mousePosInRoom.x % layerDef.gridCellWidth) /
            (layerDef.gridCellWidth / 3))

    const cornerY = Math.floor(
        (mousePosInRoom.y % layerDef.gridCellHeight) /
            (layerDef.gridCellHeight / 3))

    const fillType =
        cornerX === 0 && cornerY === 0 ?
            Defs.BrushTileType.DiagonalUL :
        cornerX === 2 && cornerY === 0 ?
            Defs.BrushTileType.DiagonalUR :
        cornerX === 0 && cornerY === 2 ?
            Defs.BrushTileType.DiagonalDL :
        cornerX === 2 && cornerY === 2 ?
            Defs.BrushTileType.DiagonalDR :
        Defs.BrushTileType.Full

    return fillType
}


export function getBrushTileDecisionAt(
    brush: Defs.DefTileBrush,
    tileField: TileField,
    cell: { x: number, y: number },
    secondPass: boolean)
    : number | null | undefined
{
    const connections: Defs.BrushTileConnections = [
        Defs.BrushTileType.None, Defs.BrushTileType.None, Defs.BrushTileType.None,
        Defs.BrushTileType.None, Defs.BrushTileType.None, Defs.BrushTileType.None,
        Defs.BrushTileType.None, Defs.BrushTileType.None, Defs.BrushTileType.None,
    ]

    for (let cx = -1; cx <= 1; cx++)
    for (let cy = -1; cy <= 1; cy++)
    {
        const connection = (cx + 1) + (cy + 1) * 3

        const neighborCell = { x: cell.x + cx, y: cell.y + cy }
        const neighborCellIndex = getTileFieldCellIndexForCell(
            tileField,
            neighborCell)

        if (neighborCellIndex === undefined)
        {
            if (global.editors.mapEditing.tileBrushEdgeBehavior === "connectAlways")
                connections[connection] = Defs.BrushTileType.Full

            continue
        }

        const neighborTile = tileField.tiles[neighborCellIndex]
        if (!neighborTile || neighborTile.tilesetDefId !== brush.tilesetDefId)
            continue

        connections[connection] = Defs.getTileTypeInTileBrush(
            brush,
            neighborTile.tileId)
    }

    if (secondPass)
    {
        const selfType = connections[4]

        for (let cx = -1; cx <= 1; cx++)
        for (let cy = -1; cy <= 1; cy++)
        {
            if (cx === 0 && cy === 0)
                continue
            
            const neighborCell = { x: cell.x + cx, y: cell.y + cy }
            const neighborCellIndex = getTileFieldCellIndexForCell(
                tileField,
                neighborCell)
                
            if (neighborCellIndex === undefined)
                continue

            const neighborTile = tileField.tiles[neighborCellIndex]
            if (!neighborTile || neighborTile.tilesetDefId !== brush.tilesetDefId)
                continue

            const neighborData = Defs.getTileBrushData(
                brush,
                neighborTile.tileId)

            const connection = (cx + 1) + (cy + 1) * 3
            const inverseConnection = (-cx + 1) + (-cy + 1) * 3

            if (neighborData.connections[inverseConnection] === selfType)
                continue

            if (neighborData.connections[inverseConnection] === Defs.BrushTileType.Full &&
                selfType !== Defs.BrushTileType.None)
                continue

            if (selfType === Defs.BrushTileType.Full &&
                neighborData.connections[inverseConnection] !== Defs.BrushTileType.None)
                continue

            connections[connection] = Defs.BrushTileType.None
        }
    }

    const decidedTileIndex =
        Defs.getMatchingTileInTileBrush(brush, connections)

    if (decidedTileIndex !== undefined)
        return decidedTileIndex

    if (connections[4] === Defs.BrushTileType.None)
        return null

    return Defs.getTileBrushDefaultTile(brush, connections[4])
}


export function fixBrushTileAt(
    brush: Defs.DefTileBrush,
    layer: LayerTile,
    cell: { x: number, y: number },
    secondPass: boolean)
    : LayerTile
{
    const neighborTileIndex = getTileFieldCellIndexForCell(
        layer.tileField,
        cell)

    if (neighborTileIndex === undefined)
        return layer

    const neighborTile = layer.tileField.tiles[neighborTileIndex]
    if (neighborTile &&
        neighborTile.tilesetDefId !== brush.tilesetDefId)
        return layer

    if (neighborTile &&
        !Defs.isTileIndexInBrush(brush, neighborTile.tileId))
        return layer

    const modifiedTileIndex = getBrushTileDecisionAt(
        brush,
        layer.tileField,
        cell,
        secondPass)

    if (modifiedTileIndex === undefined)
        return layer

    if (modifiedTileIndex === null)
        return layer

    const newType = Defs.getTileTypeInTileBrush(
        brush,
        modifiedTileIndex)
        
    const modifiedTile: Tile = {
        tilesetDefId: brush.tilesetDefId,
        tileId: modifiedTileIndex,
    }

    if (!isNewTileOfDifferentBrushConnections(layer, brush, cell, modifiedTile))
        return layer

    return setTile(
        layer,
        cell,
        modifiedTile)
}


export function fixBrushTileRegion(
    brush: Defs.DefTileBrush,
    layer: LayerTile,
    aroundCell: { x: number, y: number })
    : LayerTile
{
    for (let pass = 0; pass < 2; pass++)
    {
        for (let cy = -1; cy <= 1; cy++)
        for (let cx = -1; cx <= 1; cx++)
        {
            const neighborCell = {
                x: aroundCell.x + cx,
                y: aroundCell.y + cy,
            }

            layer = fixBrushTileAt(
                brush,
                layer,
                neighborCell,
                pass !== 0)
        }
    }

    return layer
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


