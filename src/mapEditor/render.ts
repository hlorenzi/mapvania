import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Editors from "../data/editors"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Images from "../data/images"
import { global } from "../global"


export function render(state: MapEditor.State)
{
    const defs = (global.editors.editors[state.editorIndex] as Editors.EditorMap).defs
    const map = (global.editors.editors[state.editorIndex] as Editors.EditorMap).map

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

    const editingLayerDef = Defs.getLayerDef(defs, global.editors.mapEditing.layerDefId)

    renderWorldLayerBkg(state, defs, editingLayerDef)

    let editingRoom: Map.Room | null = null
    for (const room of Object.values(map.rooms))
    {
        if (room.id === state.roomId)
        {
            editingRoom = room
            continue
        }

        state.ctx.save()
        state.ctx.translate(room.x, room.y)
    
        renderStageBkg(state, room)
        renderStage(state, defs, room, editingLayerDef)

        state.ctx.restore()
    }

    if (editingRoom)
    {
        state.ctx.save()
        state.ctx.translate(editingRoom.x, editingRoom.y)
    
        renderStageBkg(state, editingRoom)
        renderTileLayerBkg(state, defs, editingRoom, editingLayerDef)
        renderStage(state, defs, editingRoom, editingLayerDef)
        renderTileLayerTools(state, defs, editingLayerDef)
        
        state.ctx.restore()
    }

    renderWorldLayerTools(state, defs, editingLayerDef)
    
    state.ctx.restore()
}


export function renderStageBkg(
    state: MapEditor.State,
    room: Map.Room)
{
    //state.ctx.fillStyle = "#000"
    //state.ctx.fillRect(8, 8, stage.width, stage.height)
    
    state.ctx.fillStyle = "#181818"
    state.ctx.fillRect(0, 0, room.width, room.height)
}


export function renderStage(
    state: MapEditor.State,
    defs: Defs.Defs,
    stage: Map.Room,
    editingLayerDef: Defs.DefLayer | undefined)
{
    state.ctx.save()
    
    for (const [_, layer] of Object.entries(stage.layers))
    {
        if (layer.type === "tile")
        {
            const layerDef = Defs.getLayerDef(defs, layer.layerDefId)
            if (!layerDef)
                continue

            for (const cell of Map.enumerateTileFieldCells(layer.tileField))
            {
                if (!cell.tile)
                    continue

                const tileset = Defs.getTileset(defs, cell.tile.tilesetDefId)
                if (!tileset)
                    continue

                const image = Images.getImageLazy(tileset.imageSrc)
                if (!image)
                    continue

                const imagePx = Defs.getPixelForTileIndex(tileset, cell.tile.tileId)

                state.ctx.drawImage(
                    image.element,
                    imagePx.x, imagePx.y,
                    tileset.gridCellWidth, tileset.gridCellHeight,
                    cell.x * layerDef.gridCellWidth,
                    cell.y * layerDef.gridCellHeight,
                    layerDef.gridCellWidth, layerDef.gridCellHeight)
            }
        }
    }

    const strongBorder = global.editors.mapEditing.layerDefId === Editors.LAYERDEF_ID_WORLD ?
        state.stageSelection.has(stage.id) :
        stage.id === state.roomId

    state.ctx.strokeStyle = strongBorder ? "#fff" : "#888"

    state.ctx.strokeRect(0, 0, stage.width, stage.height)

    state.ctx.restore()
}


export function renderWorldLayerBkg(
    state: MapEditor.State,
    defs: Defs.Defs,
    editingLayerDef: Defs.DefLayer | undefined)
{
    if (editingLayerDef || global.editors.mapEditing.layerDefId !== Editors.LAYERDEF_ID_WORLD)
        return
        
    state.ctx.save()

    // Draw dashed lines
    const cellW = defs.generalDefs.roomWidthMultiple
    const cellH = defs.generalDefs.roomHeightMultiple

    const dashSize = Math.max(
        Math.ceil(defs.generalDefs.roomWidthMultiple / state.camera.zoom),
        Math.ceil(defs.generalDefs.roomHeightMultiple / state.camera.zoom)) / 4

    state.ctx.strokeStyle = "#444"
    state.ctx.lineDashOffset = dashSize / 2
    state.ctx.setLineDash([dashSize, dashSize])
    
    const horzCells = Math.ceil(state.canvasWidth  / state.camera.zoom / cellW) + 1
    const vertCells = Math.ceil(state.canvasHeight / state.camera.zoom / cellH) + 1

    const xView = Math.floor(state.camera.pos.x / state.camera.zoom / cellW) * cellW
    const yView = Math.floor(state.camera.pos.y / state.camera.zoom / cellH) * cellH

    const cellXMin = xView - Math.ceil(horzCells / 2) * cellW
    const cellYMin = yView - Math.ceil(vertCells / 2) * cellH
    const cellXMax = xView + Math.ceil(horzCells / 2) * cellW
    const cellYMax = yView + Math.ceil(vertCells / 2) * cellH

    state.ctx.beginPath()
    if (horzCells < 100 && vertCells < 100)
    {
        for (let x = cellXMin; x <= cellXMax; x += cellW)
        {
            state.ctx.moveTo(x, cellYMin)
            state.ctx.lineTo(x, cellYMax)
        }
        
        for (let y = cellYMin; y <= cellYMax; y += cellH)
        {
            state.ctx.moveTo(cellXMin, y)
            state.ctx.lineTo(cellXMax, y)
        }
    }
    state.ctx.stroke()

    state.ctx.restore()
}
    

export function renderWorldLayerTools(
    state: MapEditor.State,
    defs: Defs.Defs,
    editingLayerDef: Defs.DefLayer | undefined)
{
    if (editingLayerDef || global.editors.mapEditing.layerDefId !== Editors.LAYERDEF_ID_WORLD)
        return
        
    state.ctx.save()

    if (global.editors.mapEditing.tileTool === "draw" &&
        !state.onMouseMove)
    {
        state.ctx.save()
        state.ctx.globalAlpha = 0.5

        state.ctx.strokeStyle = "#4f0"
        state.ctx.strokeRect(
            state.mouse.tile.x * defs.generalDefs.roomWidthMultiple,
            state.mouse.tile.y * defs.generalDefs.roomHeightMultiple,
            defs.generalDefs.roomWidthMultiple,
            defs.generalDefs.roomHeightMultiple)

        state.ctx.restore()
    }

    if (state.rectSelection)
    {
        state.ctx.save()

        state.ctx.strokeStyle = "#0cf"

        const tx1 = Math.min(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
        const tx2 = Math.max(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
        const ty1 = Math.min(state.rectSelection.tile1.y, state.rectSelection.tile2.y)
        const ty2 = Math.max(state.rectSelection.tile1.y, state.rectSelection.tile2.y)

        state.ctx.strokeRect(
            tx1 * defs.generalDefs.roomWidthMultiple,
            ty1 * defs.generalDefs.roomHeightMultiple,
            (tx2 - tx1 + 1) * defs.generalDefs.roomWidthMultiple,
            (ty2 - ty1 + 1) * defs.generalDefs.roomHeightMultiple)

        state.ctx.restore()
    }

    if (state.onRenderWorldTool)
    {
        state.ctx.save()
        state.onRenderWorldTool(state)
        state.ctx.restore()
    }
    
    state.ctx.restore()
}


export function renderTileLayerBkg(
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    editingLayerDef: Defs.DefLayer | undefined)
{
    if (!editingLayerDef || editingLayerDef.type !== "tile")
        return
        
    state.ctx.save()

    // Draw dashed lines
    state.ctx.strokeStyle = "#444"
    state.ctx.lineDashOffset = 1
    state.ctx.setLineDash([2, 2])

    state.ctx.beginPath()
    for (let x = editingLayerDef.gridCellWidth; x < room.width; x += editingLayerDef.gridCellWidth)
    {
        state.ctx.moveTo(x, 0)
        state.ctx.lineTo(x, room.height)
    }

    for (let y = editingLayerDef.gridCellHeight; y < room.height; y += editingLayerDef.gridCellHeight)
    {
        state.ctx.moveTo(0, y)
        state.ctx.lineTo(room.width, y)
    }
    state.ctx.stroke()

    state.ctx.restore()
}


export function renderTileLayerTools(
    state: MapEditor.State,
    defs: Defs.Defs,
    editingLayerDef: Defs.DefLayer | undefined)
{
    if (!editingLayerDef || editingLayerDef.type !== "tile")
        return
        
    state.ctx.save()

    if (global.editors.mapEditing.tileTool === "draw" &&
        !state.onMouseMove)
    {
        state.ctx.save()
        state.ctx.globalAlpha = 0.5

        for (const cell of Map.enumerateTileFieldCellsCentered(global.editors.mapEditing.tileStamp))
        {
            if (!cell.tile)
                continue

            const tileset = Defs.getTileset(defs, cell.tile.tilesetDefId)
            if (!tileset)
                continue

            const image = Images.getImageLazy(tileset.imageSrc)
            if (!image)
                continue

            const imagePx = Defs.getPixelForTileIndex(tileset, cell.tile.tileId)

            state.ctx.drawImage(
                image.element,
                imagePx.x, imagePx.y,
                tileset.gridCellWidth, tileset.gridCellHeight,
                (state.mouse.tile.x + cell.x) * editingLayerDef.gridCellWidth,
                (state.mouse.tile.y + cell.y) * editingLayerDef.gridCellHeight,
                editingLayerDef.gridCellWidth, editingLayerDef.gridCellHeight)
        }

        state.ctx.restore()
    }
    else if (global.editors.mapEditing.tileTool === "erase")
    {
        state.ctx.strokeStyle = "#f40"
        state.ctx.strokeRect(
            state.mouse.tile.x * editingLayerDef.gridCellWidth,
            state.mouse.tile.y * editingLayerDef.gridCellHeight,
            editingLayerDef.gridCellWidth,
            editingLayerDef.gridCellHeight)
    }

    if (state.rectSelection)
    {
        state.ctx.save()

        state.ctx.strokeStyle = "#0cf"

        const tx1 = Math.min(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
        const tx2 = Math.max(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
        const ty1 = Math.min(state.rectSelection.tile1.y, state.rectSelection.tile2.y)
        const ty2 = Math.max(state.rectSelection.tile1.y, state.rectSelection.tile2.y)

        state.ctx.strokeRect(
            tx1 * editingLayerDef.gridCellWidth,
            ty1 * editingLayerDef.gridCellHeight,
            (tx2 - tx1 + 1) * editingLayerDef.gridCellWidth,
            (ty2 - ty1 + 1) * editingLayerDef.gridCellHeight)

        state.ctx.restore()
    }
    
    state.ctx.restore()
}