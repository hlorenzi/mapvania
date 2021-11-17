export type ID = number


export interface Project
{
    // The next id to be assigned to a newly-created object
    nextId: ID

    // The global definitions
    defs: Defs

    // The list of worlds
    worlds: World[]
}


export interface Defs
{
    // The default dimensions of a new stage, in pixels
    stageDefaultWidth: number
    stageDefaultHeight: number
    
    // The list of layer definitions
    layerDefs: DefLayer[]

    // The list of tileset definitions
    tilesetDefs: DefTileset[]
}


export type DefLayer =
    DefLayerTile |
    DefLayerObject


export interface DefLayerCommon
{
    id: ID
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
    id: ID
    name: string

    imageId: ID

    gridCellWidth: number
    gridCellHeight: number

    gridGapX: number
    gridGapY: number

    gridOffsetX: number
    gridOffsetY: number
}


export interface World
{
    id: ID
    name: string
    
    stages: Stage[]
}


export interface Stage
{
    id: ID
    name: string

    // The top-left position within a world, in pixels
    x: number
    y: number

    // The dimensions of the stage, in pixels
    width: number
    height: number

    layers: Layer[]
}


export type Layer =
    LayerTile |
    LayerObject


export interface LayerCommon
{
    layerId: ID
}


export interface LayerTile extends LayerCommon
{
    type: "tile"
    tiles: TileField
}


export interface LayerObject extends LayerCommon
{
    type: "object"
}


export interface TileField
{
    tiles: Tile[]
    width: number
    height: number
}


export interface Tile
{
    tilesetId: ID
    tileId: number
}


export function projectCreate(): Project
{
    return {
        nextId: 3,

        defs: {
            layerDefs: [{
                id: 2,
                name: "layer_1",
                type: "tile",
                gridCellWidth: 16,
                gridCellHeight: 16,
            }],

            tilesetDefs: [],

            stageDefaultWidth: 16 * 27,
            stageDefaultHeight: 16 * 15,
        },

        worlds: [{
            id: 0,
            name: "world_1",

            stages: [{
                id: 1,
                name: "stage_1",

                x: 0,
                y: 0,
                width: 16 * 27,
                height: 16 * 15,

                layers: [],
            }]
        }],
    }
}