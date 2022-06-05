import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as UI from "../ui"
import { global } from "../global"


export interface State
{
    editorIndex: number

    roomId: ID.ID

    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    canvasWidth: number
    canvasHeight: number

    onMouseMove: null | ((state: State) => void)
    onMouseUp: null | ((state: State) => void)
    onRenderWorldTool: null | ((state: State) => void)

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

    rectSelection: null |
    {
        tile1: { x: number, y: number }
        tile2: { x: number, y: number }
    }

    stageSelection: Set<ID.ID>
}


export function createState(editorIndex: number, roomId: ID.ID): State
{
    return {
        editorIndex,

        roomId,

        canvas: null!,
        ctx: null!,
        canvasWidth: 0,
        canvasHeight: 0,

        onMouseMove: null,
        onMouseUp: null,
        onRenderWorldTool: null,

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

        rectSelection: null,

        stageSelection: new Set<ID.ID>(),
    }
}


export function onResize(state: State)
{
    const canvasRect = state.canvas.getBoundingClientRect()
    state.canvasWidth = Math.floor(canvasRect.width)
    state.canvasHeight = Math.floor(canvasRect.height)

    state.canvas.width = state.canvasWidth
    state.canvas.height = state.canvasHeight

    MapEditor.render(state)
}


export function onMouseDown(state: State, ev: MouseEvent)
{
    const defs = (global.editors.editors[state.editorIndex] as Editors.EditorMap).defs
    const map = (global.editors.editors[state.editorIndex] as Editors.EditorMap).map

    ev.preventDefault()
    
    if (state.onMouseMove)
        return

    //addHistoryStep()

    state.mouseDownOrigin =
    {
        posRaw: state.mouse.posRaw,
        pos: state.mouse.pos,
        tile: state.mouse.tile,
    }

    if (ev.button != 0)
        MapEditor.setupPan(state)
    else
    {
        if (global.editors.mapEditing.layerDefId === Editors.LAYERDEF_ID_WORLD)
        {
            if (global.editors.mapEditing.tileTool === "move")
            {
                if (!ev.ctrlKey)
                    state.stageSelection.clear()
                
                for (const room of Object.values(map.rooms))
                {
                    if (state.mouse.pos.x >= room.x &&
                        state.mouse.pos.x <= room.x + room.width &&
                        state.mouse.pos.y >= room.y &&
                        state.mouse.pos.y <= room.y + room.height)
                    {
                        state.stageSelection.add(room.id)
                        state.roomId = room.id
                        break
                    }
                }
    
                MapEditor.setupWorldMove(state)
            }
            else if (global.editors.mapEditing.tileTool === "draw")
                MapEditor.setupWorldDraw(state)
        }
        else
        {
            let switchedStages = false

            for (const room of Object.values(map.rooms))
            {
                if (room.id !== state.roomId &&
                    state.mouse.pos.x >= room.x &&
                    state.mouse.pos.x <= room.x + room.width &&
                    state.mouse.pos.y >= room.y &&
                    state.mouse.pos.y <= room.y + room.height)
                {
                    state.roomId = room.id
                    switchedStages = true
                    break
                }
            }

            if (!switchedStages)
            {
                const editingLayerDef = Defs.getLayerDef(defs, global.editors.mapEditing.layerDefId)
                /*if (editingLayerDef && editingLayerDef.type === "tile")
                {
                    if (global.editors.mapEditing.tileTool === "draw")
                        MapEditor.setupDrawTiles(state)

                    else if (global.editors.mapEditing.tileTool === "erase")
                        MapEditor.setupEraseTiles(state)

                    else if (global.editors.mapEditing.tileTool === "select")
                        MapEditor.setupSelectTiles(state)
                }*/
            }
        }
    }

    onMouseMove(state, ev)
}


export function onMouseMove(state: State, ev: MouseEvent)
{
    const defs = (global.editors.editors[state.editorIndex] as Editors.EditorMap).defs
    const map = (global.editors.editors[state.editorIndex] as Editors.EditorMap).map

    const canvasRect = state.canvas.getBoundingClientRect()

    state.mouse.posRaw = {
        x: ev.clientX - canvasRect.left,
        y: ev.clientY - canvasRect.top,
    }

    state.mouse.pos = {
        x: (state.mouse.posRaw.x - state.canvasWidth  / 2 + state.camera.pos.x) / state.camera.zoom,
        y: (state.mouse.posRaw.y - state.canvasHeight / 2 + state.camera.pos.y) / state.camera.zoom,
    }

    const layer = defs.layerDefs.find(l => l.id === global.editors.mapEditing.layerDefId)
    const stage = map.rooms[state.roomId]
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
            x: Math.floor(state.mouse.pos.x / defs.generalDefs.roomWidthMultiple),
            y: Math.floor(state.mouse.pos.y / defs.generalDefs.roomHeightMultiple),
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
    
    MapEditor.render(state)
}


export function onMouseUp(state: State, ev: MouseEvent)
{
    onMouseMove(state, ev)

    //if (state.onMouseMove)
    //    addHistoryStep()

    if (state.onMouseUp)
        state.onMouseUp(state)

    state.onMouseMove = null
    state.onMouseUp = null
    state.onRenderWorldTool = null
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
    
    MapEditor.render(state)
}


export function onKeyDown(state: State, ev: KeyboardEvent)
{
    const key = ev.key.toLowerCase()

    switch (key)
    {
        case "c":
            if (ev.ctrlKey)
            {
                //copyTileSelection(state)
                state.rectSelection = null
                MapEditor.render(state)
            }
            break

        case "x":
            if (ev.ctrlKey)
            {
                //copyTileSelection(state)
                //addHistoryStep()
                //eraseTileSelection(state)
                //addHistoryStep()
                state.rectSelection = null
                MapEditor.render(state)
            }
            break

        case "delete":
        case "backspace":
            //addHistoryStep()
            //eraseTileSelection(state)
            //addHistoryStep()
            state.rectSelection = null
            MapEditor.render(state)
            break
    }
}


/*export function copyTileSelection(state: State)
{
    if (!state.rectSelection)
        return
    
    global.project = Project.ensureStageLayer(
        global.project,
        state.worldId,
        state.stageId,
        global.editingLayerId)

    let layer = Project.getStageLayer(
        global.project,
        state.worldId,
        state.stageId,
        global.editingLayerId)

    if (!layer || layer.type !== "tile")
        return

    const tx1 = Math.min(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
    const tx2 = Math.max(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
    const ty1 = Math.min(state.rectSelection.tile1.y, state.rectSelection.tile2.y)
    const ty2 = Math.max(state.rectSelection.tile1.y, state.rectSelection.tile2.y)

    const tileField: Project.TileField =
    {
        width: tx2 - tx1 + 1,
        height: ty2 - ty1 + 1,
        tiles: [],
    }

    for (let y = ty1; y <= ty2; y++)
    {
        for (let x = tx1; x <= tx2; x++)
        {
            const cellIndex = Project.getTileFieldCellIndexForCell(layer.tileField, { x, y })
            if (cellIndex === undefined)
                tileField.tiles.push(undefined)
            else
                tileField.tiles.push(layer.tileField.tiles[cellIndex])
        }
    }

    global.editingTileStamp = tileField
    global.editingTilesetStampSet.clear()
    global.editingTileTool = "draw"
    global.editingToken.commit()
}


export function eraseTileSelection(state: State)
{
    if (!state.rectSelection)
        return
    
    global.project = Project.ensureStageLayer(
        global.project,
        state.worldId,
        state.stageId,
        global.editingLayerId)

    let layer = Project.getStageLayer(
        global.project,
        state.worldId,
        state.stageId,
        global.editingLayerId)

    if (!layer || layer.type !== "tile")
        return

    const tx1 = Math.min(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
    const tx2 = Math.max(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
    const ty1 = Math.min(state.rectSelection.tile1.y, state.rectSelection.tile2.y)
    const ty2 = Math.max(state.rectSelection.tile1.y, state.rectSelection.tile2.y)

    for (let y = ty1; y <= ty2; y++)
    {
        for (let x = tx1; x <= tx2; x++)
        {
            const cellIndex = Project.getTileFieldCellIndexForCell(layer.tileField, { x, y })
            if (cellIndex === undefined)
                continue
        
            layer = {
                ...layer,
                tileField: {
                    ...layer.tileField,
                    tiles: [
                        ...layer.tileField.tiles.slice(0, cellIndex),
                        undefined,
                        ...layer.tileField.tiles.slice(cellIndex + 1),
                    ]
                }
            }
        }
    }

    global.project = Project.setStageLayer(
        global.project,
        state.worldId,
        state.stageId,
        global.editingLayerId,
        layer)

    global.projectToken.commit()
}*/