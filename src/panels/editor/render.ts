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
        state.canvasWidth  / 2 - state.camera.pos.x,
        state.canvasHeight / 2 - state.camera.pos.y)
        
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

    const editingLayer = global.project.defs.layerDefs.find(l => l.id === global.editingLayerId)
    if (editingLayer)
    {
        state.ctx.strokeStyle = "#888"
        state.ctx.setLineDash([3, 1])

        state.ctx.beginPath()
        for (let x = 0; x < stage.width; x += editingLayer.gridCellWidth)
        {
            state.ctx.moveTo(x, 0)
            state.ctx.lineTo(x, stage.height)
        }

        for (let y = 0; y < stage.height; y += editingLayer.gridCellHeight)
        {
            state.ctx.moveTo(0, y)
            state.ctx.lineTo(stage.width, y)
        }
        state.ctx.stroke()
    }

    state.ctx.restore()
}