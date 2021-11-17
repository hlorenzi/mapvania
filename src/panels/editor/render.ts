import * as Editor from "./index"
import * as Project  from "../../project"
import { global, deepAssignProject } from "../../global"


export interface RenderOptions
{

}


export function render(state: Editor.State, options: RenderOptions = {})
{
    state.ctx.save()

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
    
    state.ctx.strokeStyle = "#fff"
    state.ctx.strokeRect(0, 0, stage.width, stage.height)

    const layer = global.project.defs.layerDefs.find(l => l.id === global.editingLayerId)
    if (layer)
    {
        state.ctx.save()

        state.ctx.strokeStyle = "#888"
        state.ctx.lineDashOffset = 1.5
        state.ctx.setLineDash([3, 1])

        state.ctx.beginPath()
        for (let x = layer.gridCellWidth; x < stage.width; x += layer.gridCellWidth)
        {
            state.ctx.moveTo(x, 0)
            state.ctx.lineTo(x, stage.height)
        }

        for (let y = layer.gridCellHeight; y < stage.height; y += layer.gridCellHeight)
        {
            state.ctx.moveTo(0, y)
            state.ctx.lineTo(stage.width, y)
        }
        state.ctx.stroke()

        state.ctx.restore()

        if (!state.onMouseMove)
        {
            state.ctx.strokeStyle = "#0af"
            state.ctx.strokeRect(
                state.mouse.tile.x * layer.gridCellWidth,
                state.mouse.tile.y * layer.gridCellHeight,
                layer.gridCellWidth,
                layer.gridCellHeight)
        }
    }

    state.ctx.restore()
}