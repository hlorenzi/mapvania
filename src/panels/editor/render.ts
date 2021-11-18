import * as Editor from "./index"
import * as Project  from "../../project"
import { global, deepAssignProject } from "../../global"


export interface RenderOptions
{

}


export function render(state: Editor.State, options: RenderOptions = {})
{
    state.ctx.save()

    state.ctx.imageSmoothingQuality = "low"
    state.ctx.imageSmoothingEnabled = false

    state.ctx.fillStyle = "#111"
    state.ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight)

    state.ctx.lineWidth = 1 / state.camera.zoom

    state.ctx.translate(
        Math.floor(state.canvasWidth  / 2 - state.camera.pos.x) + 0.5,
        Math.floor(state.canvasHeight / 2 - state.camera.pos.y) + 0.5)
        
    state.ctx.scale(state.camera.zoom, state.camera.zoom)

    const world = global.project.worlds.find(l => l.id === state.worldId)!
    for (const stage of world.stages)
        renderStage(state, options, stage)

    state.ctx.restore()
}


export function renderStage(
    state: Editor.State,
    options: RenderOptions,
    stage: Project.Stage)
{
    state.ctx.save()
    state.ctx.translate(stage.x, stage.y)

    state.ctx.fillStyle = "#000"
    state.ctx.fillRect(8, 8, stage.width, stage.height)
    
    state.ctx.fillStyle = "#111"
    state.ctx.fillRect(0, 0, stage.width, stage.height)
    
    for (const layer of stage.layers)
    {
        if (layer.type === "tile")
        {
            const layerDef = Project.getLayerDef(global.project, layer.layerId)
            if (!layerDef)
                continue

            for (const cell of Project.enumerateTileFieldCells(layer.tileField))
            {
                const tileset = Project.getTileset(global.project, cell.tile.tilesetId)
                if (!tileset)
                    continue

                const image = global.images[tileset.imageId]
                if (!image)
                    continue

                const imagePx = Project.getPixelForTileIndex(tileset, cell.tile.tileId)

                state.ctx.drawImage(
                    image,
                    imagePx.x, imagePx.y,
                    tileset.gridCellWidth, tileset.gridCellHeight,
                    cell.x * layerDef.gridCellWidth,
                    cell.y * layerDef.gridCellHeight,
                    layerDef.gridCellWidth, layerDef.gridCellHeight)
            }
        }
    }

    const editingLayerDef = Project.getLayerDef(global.project, global.editingLayerId)
    if (editingLayerDef)
    {
        state.ctx.save()

        state.ctx.strokeStyle = "#888"
        state.ctx.lineDashOffset = 1
        state.ctx.setLineDash([2, 2])

        state.ctx.beginPath()
        for (let x = editingLayerDef.gridCellWidth; x < stage.width; x += editingLayerDef.gridCellWidth)
        {
            state.ctx.moveTo(x, 0)
            state.ctx.lineTo(x, stage.height)
        }

        for (let y = editingLayerDef.gridCellHeight; y < stage.height; y += editingLayerDef.gridCellHeight)
        {
            state.ctx.moveTo(0, y)
            state.ctx.lineTo(stage.width, y)
        }
        state.ctx.stroke()

        state.ctx.restore()

        if (!state.onMouseMove)
        {
            /*state.ctx.strokeStyle = "#0af"
            state.ctx.strokeRect(
                state.mouse.tile.x * editingLayerDef.gridCellWidth,
                state.mouse.tile.y * editingLayerDef.gridCellHeight,
                editingLayerDef.gridCellWidth,
                editingLayerDef.gridCellHeight)*/

            if (editingLayerDef.type == "tile")
            {
                state.ctx.save()
                state.ctx.globalAlpha = 0.5

                for (const cell of Project.enumerateTileFieldCellsCentered(global.editingTileStamp))
                {
                    const tileset = Project.getTileset(global.project, cell.tile.tilesetId)
                    if (!tileset)
                        continue

                    const image = global.images[tileset.imageId]
                    if (!image)
                        continue

                    const imagePx = Project.getPixelForTileIndex(tileset, cell.tile.tileId)

                    state.ctx.drawImage(
                        image,
                        imagePx.x, imagePx.y,
                        tileset.gridCellWidth, tileset.gridCellHeight,
                        (state.mouse.tile.x + cell.x) * editingLayerDef.gridCellWidth,
                        (state.mouse.tile.y + cell.y) * editingLayerDef.gridCellHeight,
                        editingLayerDef.gridCellWidth, editingLayerDef.gridCellHeight)
                }

                state.ctx.restore()
            }
        }
    }

    state.ctx.strokeStyle = "#fff"
    state.ctx.strokeRect(0, 0, stage.width, stage.height)

    state.ctx.restore()
}