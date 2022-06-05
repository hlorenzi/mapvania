import * as ID from "./id"
import * as Defs from "./defs"


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


export function getStageLayer(map: Map, roomId: ID.ID, layerDefId: ID.ID): Layer | undefined
{
    const room = getRoom(map, roomId)
    if (!room)
        return undefined

    return room.layers[layerDefId]
}


export function setStageLayer(
    map: Map,
    stageId: ID.ID,
    layerId: ID.ID,
    layer: Layer)
    : Map
{
    const stage = getRoom(map, stageId)
    if (!stage)
        return map

    return setRoom(map, stageId, {
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

    const layer = getStageLayer(map, stageId, layerDefId)
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
    }

    return map
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