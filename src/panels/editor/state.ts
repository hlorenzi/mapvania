import * as Editor from "./index"
import * as Project from "../../project/index"
import { global, deepAssignProject } from "../../global"


export interface State
{
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    canvasWidth: number
    canvasHeight: number

    onMouseMove: null | ((state: State) => void)
    onMouseUp: null | ((state: State) => void)
    onRender: null | ((state: State) => void)

    worldId: Project.ID
    stageId: Project.ID

    camera:
    {
        pos: { x: number, y: number }
        zoom: number
    }

    mouse:
    {
        posRaw: { x: number, y: number }
        pos: { x: number, y: number }
        tile: { x: number, y: number }
    }

    mouseDownOrigin:
    {
        posRaw: { x: number, y: number }
        pos: { x: number, y: number }
        tile: { x: number, y: number }
    }

    mouseDownDelta:
    {
        posRaw: { x: number, y: number }
        pos: { x: number, y: number }
        tile: { x: number, y: number }
    }
}


export function createState(worldId: Project.ID, stageId: Project.ID): State
{
    return {
        canvas: null!,
        ctx: null!,
        canvasWidth: 0,
        canvasHeight: 0,

        onMouseMove: null,
        onMouseUp: null,
        onRender: null,

        worldId,
        stageId,

        camera:
        {
            pos: { x: 0, y: 0 },
            zoom: 1,
        },

        mouse:
        {
            posRaw: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
            tile: { x: 0, y: 0 },
        },
        
        mouseDownOrigin:
        {
            posRaw: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
            tile: { x: 0, y: 0 },
        },

        mouseDownDelta:
        {
            posRaw: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
            tile: { x: 0, y: 0 },
        },
    }
}


export function onResize(state: State)
{
    const canvasRect = state.canvas.getBoundingClientRect()
    state.canvasWidth = canvasRect.width
    state.canvasHeight = canvasRect.height

    state.canvas.width = canvasRect.width
    state.canvas.height = canvasRect.height

    Editor.render(state, {})
}


export function onMouseDown(state: State, ev: MouseEvent)
{
    ev.preventDefault()
    
    if (state.onMouseMove)
        return

    state.mouseDownOrigin =
    {
        posRaw: state.mouse.posRaw,
        pos: state.mouse.pos,
        tile: state.mouse.tile,
    }

    if (ev.button != 0)
        Editor.setupPan(state)

    onMouseMove(state, ev)
}


export function onMouseMove(state: State, ev: MouseEvent)
{
    const canvasRect = state.canvas.getBoundingClientRect()

    state.mouse.posRaw = {
        x: ev.clientX - canvasRect.left,
        y: ev.clientY - canvasRect.top,
    }

    state.mouse.pos = {
        x: (state.mouse.posRaw.x - state.canvasWidth  / 2 + state.camera.pos.x) / state.camera.zoom,
        y: (state.mouse.posRaw.y - state.canvasHeight / 2 + state.camera.pos.y) / state.camera.zoom,
    }

    const layer = global.project.defs.layerDefs.find(l => l.id === global.editingLayerId)
    const world = global.project.worlds.find(w => w.id === state.worldId)!
    const stage = world.stages.find(s => s.id === state.stageId)
    if (layer && stage)
    {
        state.mouse.tile = {
            x: Math.floor((state.mouse.pos.x - stage.x) / layer.gridCellWidth),
            y: Math.floor((state.mouse.pos.y - stage.y) / layer.gridCellHeight),
        }
    }
    else
    {
        state.mouse.tile = {
            x: 0,
            y: 0,
        }
    }
    
    state.mouseDownDelta.posRaw = {
        x: state.mouse.posRaw.x - state.mouseDownOrigin.posRaw.x,
        y: state.mouse.posRaw.y - state.mouseDownOrigin.posRaw.y,
    }

    state.mouseDownDelta.pos = {
        x: state.mouse.pos.x - state.mouseDownOrigin.pos.x,
        y: state.mouse.pos.y - state.mouseDownOrigin.pos.y,
    }

    state.mouseDownDelta.tile = {
        x: state.mouse.tile.x - state.mouseDownOrigin.tile.x,
        y: state.mouse.tile.y - state.mouseDownOrigin.tile.y,
    }

    if (state.onMouseMove)
        state.onMouseMove(state)
    
    Editor.render(state, {})
}


export function onMouseUp(state: State, ev: MouseEvent)
{
    onMouseMove(state, ev)

    if (state.onMouseUp)
        state.onMouseUp(state)

    state.onMouseMove = null
    state.onMouseUp = null
}


export function onMouseWheel(state: State, ev: WheelEvent)
{
    onMouseMove(state, ev)

    const mousePrevious = state.mouse.pos

    state.camera.zoom *= ev.deltaY < 0 ? 1.5 : 1 / 1.5
    
    onMouseMove(state, ev)

    state.camera.pos = {
        x: state.camera.pos.x + (mousePrevious.x - state.mouse.pos.x) * state.camera.zoom,
        y: state.camera.pos.y + (mousePrevious.y - state.mouse.pos.y) * state.camera.zoom,
    }
    
    onMouseMove(state, ev)
    
    Editor.render(state, {})
}