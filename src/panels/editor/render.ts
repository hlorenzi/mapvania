import * as Editor from "./index"
import * as Project  from "../../project"
import { global, deepAssignProject, LAYER_ID_WORLD } from "../../global"


export function render(state: Editor.State)
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
    const editingLayerDef = Project.getLayerDef(global.project, global.editingLayerId)

    renderWorldLayerBkg(state, editingLayerDef)

    let editingStage: Project.Stage | null = null
    for (const stage of world.stages)
    {
        if (stage.id === state.stageId)
        {
            editingStage = stage
            continue
        }

        state.ctx.save()
        state.ctx.translate(stage.x, stage.y)
    
        renderStageBkg(state, stage, editingLayerDef)
        renderStage(state, stage, editingLayerDef)

        state.ctx.restore()
    }

    if (editingStage)
    {
        state.ctx.save()
        state.ctx.translate(editingStage.x, editingStage.y)
    
        renderStageBkg(state, editingStage, editingLayerDef)
        renderTileLayerBkg(state, editingStage, editingLayerDef)
        renderStage(state, editingStage, editingLayerDef)
        renderTileLayerTools(state, editingStage, editingLayerDef)
        
        state.ctx.restore()
    }

    renderWorldLayerTools(state, editingLayerDef)
    
    state.ctx.restore()
}


export function renderStageBkg(
    state: Editor.State,
    stage: Project.Stage,
    editingLayerDef: Project.DefLayer | undefined)
{
    //state.ctx.fillStyle = "#000"
    //state.ctx.fillRect(8, 8, stage.width, stage.height)
    
    state.ctx.fillStyle = "#181818"
    state.ctx.fillRect(0, 0, stage.width, stage.height)
}


export function renderStage(
    state: Editor.State,
    stage: Project.Stage,
    editingLayerDef: Project.DefLayer | undefined)
{
    state.ctx.save()
    
    for (const layer of stage.layers)
    {
        if (layer.type === "tile")
        {
            const layerDef = Project.getLayerDef(global.project, layer.layerId)
            if (!layerDef)
                continue

            for (const cell of Project.enumerateTileFieldCells(layer.tileField))
            {
                if (!cell.tile)
                    continue

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

    state.ctx.strokeStyle =
        global.editingLayerId === LAYER_ID_WORLD || stage.id === state.stageId ?
        "#fff" :
        "#888"

    state.ctx.strokeRect(0, 0, stage.width, stage.height)

    state.ctx.restore()
}


export function renderWorldLayerBkg(
    state: Editor.State,
    editingLayerDef: Project.DefLayer | undefined)
{
    if (editingLayerDef || global.editingLayerId !== LAYER_ID_WORLD)
        return
        
    state.ctx.save()

    // Draw dashed lines
    const cellW = global.project.defs.stageWidthMultiple/*Math.max(
        global.project.defs.stageWidthMultiple,
        Math.ceil(global.project.defs.stageWidthMultiple / state.camera.zoom))*/

    const cellH = global.project.defs.stageHeightMultiple/*Math.max(
        global.project.defs.stageHeightMultiple,
        Math.ceil(global.project.defs.stageHeightMultiple / state.camera.zoom))*/

    const dashSize = Math.max(
        Math.ceil(global.project.defs.stageWidthMultiple / state.camera.zoom),
        Math.ceil(global.project.defs.stageHeightMultiple / state.camera.zoom)) / 4

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
    state: Editor.State,
    editingLayerDef: Project.DefLayer | undefined)
{
    if (editingLayerDef || global.editingLayerId !== LAYER_ID_WORLD)
        return
        
    state.ctx.save()

    if (global.editingTileTool === "draw" &&
        !state.onMouseMove)
    {
        state.ctx.save()
        state.ctx.globalAlpha = 0.5

        state.ctx.strokeStyle = "#4f0"
        state.ctx.strokeRect(
            state.mouse.tile.x * global.project.defs.stageWidthMultiple,
            state.mouse.tile.y * global.project.defs.stageHeightMultiple,
            global.project.defs.stageWidthMultiple,
            global.project.defs.stageHeightMultiple)

        state.ctx.restore()
    }

    if (state.selection)
    {
        state.ctx.save()

        state.ctx.strokeStyle = "#0cf"

        const tx1 = Math.min(state.selection.tile1.x, state.selection.tile2.x)
        const tx2 = Math.max(state.selection.tile1.x, state.selection.tile2.x)
        const ty1 = Math.min(state.selection.tile1.y, state.selection.tile2.y)
        const ty2 = Math.max(state.selection.tile1.y, state.selection.tile2.y)

        state.ctx.strokeRect(
            tx1 * global.project.defs.stageWidthMultiple,
            ty1 * global.project.defs.stageHeightMultiple,
            (tx2 - tx1 + 1) * global.project.defs.stageWidthMultiple,
            (ty2 - ty1 + 1) * global.project.defs.stageHeightMultiple)

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
    state: Editor.State,
    stage: Project.Stage,
    editingLayerDef: Project.DefLayer | undefined)
{
    if (!editingLayerDef || editingLayerDef.type !== "tile")
        return
        
    state.ctx.save()

    // Draw dashed lines
    state.ctx.strokeStyle = "#444"
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
}


export function renderTileLayerTools(
    state: Editor.State,
    stage: Project.Stage,
    editingLayerDef: Project.DefLayer | undefined)
{
    if (!editingLayerDef || editingLayerDef.type !== "tile")
        return
        
    state.ctx.save()

    if (global.editingTileTool === "draw" &&
        !state.onMouseMove)
    {
        state.ctx.save()
        state.ctx.globalAlpha = 0.5

        for (const cell of Project.enumerateTileFieldCellsCentered(global.editingTileStamp))
        {
            if (!cell.tile)
                continue

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
    else if (global.editingTileTool === "erase")
    {
        state.ctx.strokeStyle = "#f40"
        state.ctx.strokeRect(
            state.mouse.tile.x * editingLayerDef.gridCellWidth,
            state.mouse.tile.y * editingLayerDef.gridCellHeight,
            editingLayerDef.gridCellWidth,
            editingLayerDef.gridCellHeight)
    }

    if (state.selection)
    {
        state.ctx.save()

        state.ctx.strokeStyle = "#0cf"

        const tx1 = Math.min(state.selection.tile1.x, state.selection.tile2.x)
        const tx2 = Math.max(state.selection.tile1.x, state.selection.tile2.x)
        const ty1 = Math.min(state.selection.tile1.y, state.selection.tile2.y)
        const ty2 = Math.max(state.selection.tile1.y, state.selection.tile2.y)

        state.ctx.strokeRect(
            tx1 * editingLayerDef.gridCellWidth,
            ty1 * editingLayerDef.gridCellHeight,
            (tx2 - tx1 + 1) * editingLayerDef.gridCellWidth,
            (ty2 - ty1 + 1) * editingLayerDef.gridCellHeight)

        state.ctx.restore()
    }
    
    state.ctx.restore()
}