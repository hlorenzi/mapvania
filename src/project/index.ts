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
    // The list of layer definitions
    layerDefs: DefLayer[]

    // The default dimensions of a new stage, in pixels
    stageDefaultWidth: number
    stageDefaultHeight: number
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
            }]
        }],
    }
}