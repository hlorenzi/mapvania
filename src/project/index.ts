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

    width: number
    height: number

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


export function getTileset(project: Project, tilesetId: ID)
{
    return project.defs.tilesetDefs.find(t => t.id === tilesetId)
}


export function getLayerDef(project: Project, layerId: ID)
{
    return project.defs.layerDefs.find(l => l.id === layerId)
}


export function getWorld(project: Project, worldId: ID)
{
    return project.worlds.find(w => w.id === worldId)
}


export function setWorld(project: Project, worldId: ID, world: World): Project
{
    const worldIndex = project.worlds.findIndex(w => w.id === worldId)
    if (worldIndex < 0)
        return project

    return {
        ...project,
        worlds: [
            ...project.worlds.slice(0, worldIndex),
            world,
            ...project.worlds.slice(worldIndex + 1),
        ]
    }
}


export function getStage(project: Project, worldId: ID, stageId: ID)
{
    const world = getWorld(project, worldId)
    if (!world)
        return undefined
    
    return world.stages.find(s => s.id === stageId)
}


export function setStage(project: Project, worldId: ID, stageId: ID, stage: Stage): Project
{
    const worldIndex = project.worlds.findIndex(w => w.id === worldId)
    if (worldIndex < 0)
        return project

    const world = project.worlds[worldIndex]

    const stageIndex = world.stages.findIndex(s => s.id === stageId)
    if (stageIndex < 0)
        return project
        
    return {
        ...project,
        worlds: [
            ...project.worlds.slice(0, worldIndex),
            {
                ...world,
                stages: [
                    ...world.stages.slice(0, stageIndex),
                    stage,
                    ...world.stages.slice(stageIndex + 1),
                ]
            },
            ...project.worlds.slice(worldIndex + 1),
        ]
    }
}


export function getStageLayer(project: Project, worldId: ID, stageId: ID, layerId: ID)
{
    const stage = getStage(project, worldId, stageId)
    if (!stage)
        return undefined

    return stage.layers.find(l => l.layerId === layerId)
}


export function setStageLayer(
    project: Project,
    worldId: ID,
    stageId: ID,
    layerId: ID,
    layer: Layer)
    : Project
{
    const stage = getStage(project, worldId, stageId)
    if (!stage)
        return project

    const layerIndex = stage.layers.findIndex(l => l.layerId === layerId)
    if (layerIndex < 0)
        return project

    return setStage(project, worldId, stageId, {
        ...stage,
        layers: [
            ...stage.layers.slice(0, layerIndex),
            layer,
            ...stage.layers.slice(layerIndex + 1),
        ]
    })
}


export function ensureStageLayer(project: Project, worldId: ID, stageId: ID, layerId: ID): Project
{
    const stage = getStage(project, worldId, stageId)
    if (!stage)
        return project

    const layerDef = getLayerDef(project, layerId)
    if (!layerDef)
        return project

    const layer = getStageLayer(project, worldId, stageId, layerId)
    if (layer)
        return project

    switch (layerDef.type)
    {
        case "tile":
        {
            const widthInTiles  = Math.ceil(stage.width  / layerDef.gridCellWidth)
            const heightInTiles = Math.ceil(stage.height / layerDef.gridCellHeight)

            return setStage(project, worldId, stageId, {
                ...stage,
                layers: [
                    ...stage.layers,
                    {
                        layerId,
                        type: "tile",
                        tileField: {
                            tiles: new Array<Tile>(widthInTiles * heightInTiles).fill({ tileId: -1, tilesetId: -1 }),
                            width: widthInTiles,
                            height: heightInTiles,
                        }
                    }
                ]
            })
        }
    }

    return project
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