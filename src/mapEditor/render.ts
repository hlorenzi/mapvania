import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Editors from "../data/editors"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Images from "../data/images"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function render(state: MapEditor.State)
{
    if (state.editorIndex < 0 || state.editorIndex >= global.editors.editors.length)
        return

    const editor = global.editors.editors[state.editorIndex]
    if (editor.type !== "map")
        return
    
    const defs = editor.defs
    const map = editor.map

    state.ctx.save()

    state.ctx.imageSmoothingQuality = "low"
    state.ctx.imageSmoothingEnabled = false

    state.ctx.fillStyle = "#080808"
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
    
        renderRoomBkg(state, room)
        renderRoom(state, defs, room, editingLayerDef)

        state.ctx.restore()
    }

    if (editingRoom)
    {
        state.ctx.save()
        state.ctx.translate(editingRoom.x, editingRoom.y)
    
        renderRoomBkg(state, editingRoom)
        renderTileLayerBkg(state, defs, editingRoom, editingLayerDef)
        renderObjectLayerBkg(state, defs, editingRoom, editingLayerDef)
        renderRoom(state, defs, editingRoom, editingLayerDef)
        renderTileLayerForeground(state, defs, editingRoom, editingLayerDef)
        renderObjectLayerForeground(state, defs, editingRoom, editingLayerDef)
        
        if (state.onRenderRoomTool)
        {
            state.ctx.save()
            state.onRenderRoomTool(state)
            state.ctx.restore()
        }
        
        state.ctx.restore()
    }
    
    renderMapLayerTools(state, defs, editingLayerDef)
    renderInteractionHandles(state)

    if (state.onRenderMapTool)
    {
        state.ctx.save()
        state.onRenderMapTool(state)
        state.ctx.restore()
    }

    state.ctx.restore()
}


export function renderRoomBkg(
    state: MapEditor.State,
    room: Map.Room)
{
    //state.ctx.fillStyle = "#000"
    //state.ctx.fillRect(8, 8, stage.width, stage.height)
    
    state.ctx.fillStyle = "#181818"
    state.ctx.fillRect(0, 0, room.width, room.height)
}


export function renderRoom(
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    editingLayerDef: Defs.DefLayer | undefined)
{
    state.ctx.save()
    
    for (var i = defs.layerDefs.length - 1; i >= 0; i--)
    {
        const layerDef = defs.layerDefs[i]
        const layer = room.layers[layerDef.id]
        if (!layer)
            continue

        state.ctx.save()

        if (global.editors.mapEditing.layerDefId !== Editors.LAYERDEF_ID_MAP &&
            global.editors.mapEditing.layerDefId !== layer.layerDefId)
        {
            if (global.editors.mapEditing.showOtherLayers === "none")
            {
                state.ctx.restore()
                continue
            }
            else if (global.editors.mapEditing.showOtherLayers === "faded")
            {
                state.ctx.globalAlpha = 0.15
            }
        }

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

                drawImage(
                    state,
                    image.element,
                    imagePx.x,
                    imagePx.y,
                    tileset.gridCellWidth,
                    tileset.gridCellHeight,
                    cell.x * layerDef.gridCellWidth,
                    cell.y * layerDef.gridCellHeight,
                    layerDef.gridCellWidth,
                    layerDef.gridCellHeight)
            }
        }

        else if (layer.type === "object")
        {
            const hoverObject =
                state.roomId !== room.id ? undefined :
                global.editors.mapEditing.layerDefId !== layer.layerDefId ? undefined :
                state.onMouseMove ? undefined :
                    MapEditor.getObjectAt(state, state.mouse.posInRoom)
            
            for (const object of Object.values(layer.objects))
            {
                if (state.objectSelection.has(object.id) ||
                    hoverObject === object)
                    continue

                renderObject(
                    state,
                    defs,
                    object,
                    false,
                    false)
            }

            for (const objectId of state.objectSelection)
            {
                if (hoverObject?.id === objectId)
                    continue

                const object = layer.objects[objectId]
                if (!object)
                    continue

                renderObject(
                    state,
                    defs,
                    object,
                    false,
                    true)
            }

            if (hoverObject)
            {
                renderObject(
                    state,
                    defs,
                    hoverObject,
                    true,
                    state.objectSelection.has(hoverObject.id))
            }
        }

        state.ctx.restore()
    }

    const strongBorder = global.editors.mapEditing.layerDefId === Editors.LAYERDEF_ID_MAP ?
        state.roomSelection.has(room.id) :
        room.id === state.roomId

    state.ctx.strokeStyle = strongBorder ? "#fff" : "#888"

    state.ctx.strokeRect(0, 0, room.width, room.height)

    state.ctx.restore()
}


function renderObject(
    state: MapEditor.State,
    defs: Defs.Defs,
    object: Map.Obj,
    hovering: boolean,
    selected: boolean,
)
{
    const objectDef = Defs.getObjectDef(defs, object.objectDefId)
    if (!objectDef)
        return

    const image = Images.getImageLazy(objectDef.imageSrc)

    const topleftX = -(object.width * objectDef.pivotPercent.x)
    const topleftY = -(object.height * objectDef.pivotPercent.y)

    const imageX = topleftX - objectDef.interactionRect.x
    const imageY = topleftY - objectDef.interactionRect.y

    const imageW = object.width + (objectDef.imageRect.width - objectDef.interactionRect.width)
    const imageH = object.height + (objectDef.imageRect.height - objectDef.interactionRect.height)
    
    if (image)
        drawImage(
            state,
            image.element,
            objectDef.imageRect.x,
            objectDef.imageRect.y,
            objectDef.imageRect.width,
            objectDef.imageRect.height,
            object.x + imageX,
            object.y + imageY,
            imageW,
            imageH)

    if (hovering)
    {
        state.ctx.save()
        state.ctx.setLineDash([2, 2])
        state.ctx.strokeStyle = "#ccc"
        state.ctx.strokeRect(
            object.x + topleftX, object.y + topleftY,
            object.width, object.height)
        state.ctx.restore()
    }

    if (selected)
    {
        state.ctx.fillStyle = "#fff4"
        state.ctx.fillRect(
            object.x + topleftX, object.y + topleftY,
            object.width, object.height)

        state.ctx.strokeStyle = "#fff"
        state.ctx.strokeRect(
            object.x + topleftX, object.y + topleftY,
            object.width, object.height)
    }

    if (hovering || selected)
    {
        const visibleProperties = MapEditor.getObjectVisibleProperties(
            state, object)

        const handleSize = 12 / state.camera.zoom

        for (const visProp of visibleProperties)
        {
            if (visProp.showGhost)
            {
                state.ctx.save()
                state.ctx.globalAlpha = 0.5
                
                if (image)
                    drawImage(
                        state,
                        image.element,
                        objectDef.imageRect.x,
                        objectDef.imageRect.y,
                        objectDef.imageRect.width,
                        objectDef.imageRect.height,
                        visProp.value.x + imageX,
                        visProp.value.y + imageY,
                        imageW,
                        imageH)

                state.ctx.restore()
            }

            if (visProp.linksToIndexAsPath !== null)
            {
                state.ctx.save()
                state.ctx.strokeStyle = visProp.color
                state.ctx.lineWidth = handleSize / 4
                state.ctx.beginPath()
                state.ctx.moveTo(
                    visibleProperties[visProp.linksToIndexAsPath].value.x,
                    visibleProperties[visProp.linksToIndexAsPath].value.y)
                state.ctx.lineTo(
                    visProp.value.x,
                    visProp.value.y)
                state.ctx.stroke()
                state.ctx.restore()
            }
            else
            {
                state.ctx.save()
                state.ctx.strokeStyle = visProp.color
                state.ctx.lineWidth = handleSize / 6
                state.ctx.setLineDash([handleSize / 2, handleSize / 2])
                state.ctx.beginPath()
                state.ctx.moveTo(
                    object.x,
                    object.y)
                state.ctx.lineTo(
                    visProp.value.x,
                    visProp.value.y)
                state.ctx.stroke()
                state.ctx.restore()
            }

            if (visProp.value.type === "point")
            {
                state.ctx.fillStyle = visProp.color
                state.ctx.fillRect(
                    visProp.value.x - handleSize / 2,
                    visProp.value.y - handleSize / 2,
                    handleSize, handleSize)
            }
            else if (visProp.value.type === "rect")
            {
                state.ctx.save()
                state.ctx.strokeStyle = visProp.color
                state.ctx.lineWidth = handleSize / 4
                state.ctx.strokeRect(
                    visProp.value.x,
                    visProp.value.y,
                    visProp.value.width,
                    visProp.value.height)
                state.ctx.restore()

                state.ctx.fillStyle = visProp.color
                
                state.ctx.fillRect(
                    visProp.value.x - handleSize / 2,
                    visProp.value.y - handleSize / 2,
                    handleSize, handleSize)
                    
                state.ctx.fillRect(
                    visProp.value.x + visProp.value.width - handleSize / 2,
                    visProp.value.y - handleSize / 2,
                    handleSize, handleSize)
                    
                state.ctx.fillRect(
                    visProp.value.x + visProp.value.width - handleSize / 2,
                    visProp.value.y + visProp.value.height - handleSize / 2,
                    handleSize, handleSize)
                    
                state.ctx.fillRect(
                    visProp.value.x - handleSize / 2,
                    visProp.value.y + visProp.value.height - handleSize / 2,
                    handleSize, handleSize)
            }
        }
    }
}


export function renderWorldLayerBkg(
    state: MapEditor.State,
    defs: Defs.Defs,
    editingLayerDef: Defs.DefLayer | undefined)
{
    if (editingLayerDef || global.editors.mapEditing.layerDefId !== Editors.LAYERDEF_ID_MAP)
        return

    if (global.editors.mapEditing.showGrid === "none")
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
    

export function renderMapLayerTools(
    state: MapEditor.State,
    defs: Defs.Defs,
    editingLayerDef: Defs.DefLayer | undefined)
{
    if (editingLayerDef || global.editors.mapEditing.layerDefId !== Editors.LAYERDEF_ID_MAP)
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

    if (global.editors.mapEditing.showGrid === "background")
        drawGrid(
            state,
            "#444",
            0, 0,
            room.width, room.height,
            editingLayerDef.gridCellWidth,
            editingLayerDef.gridCellHeight)
}


export function renderTileLayerForeground(
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    editingLayerDef: Defs.DefLayer | undefined)
{
    if (!editingLayerDef || editingLayerDef.type !== "tile")
        return

    if (global.editors.mapEditing.showGrid === "foreground")
        drawGrid(
            state,
            "#444",
            0, 0,
            room.width, room.height,
            editingLayerDef.gridCellWidth,
            editingLayerDef.gridCellHeight)

    if ((global.editors.mapEditing.tileTool === "draw" ||
        global.editors.mapEditing.tileTool === "fill") &&
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

            drawImage(
                state,
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
        state.ctx.save()
        state.ctx.strokeStyle = "#f40"
        state.ctx.strokeRect(
            state.mouse.tile.x * editingLayerDef.gridCellWidth,
            state.mouse.tile.y * editingLayerDef.gridCellHeight,
            editingLayerDef.gridCellWidth,
            editingLayerDef.gridCellHeight)
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
            tx1 * editingLayerDef.gridCellWidth,
            ty1 * editingLayerDef.gridCellHeight,
            (tx2 - tx1 + 1) * editingLayerDef.gridCellWidth,
            (ty2 - ty1 + 1) * editingLayerDef.gridCellHeight)

        state.ctx.restore()
    }
}


export function renderObjectLayerBkg(
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    editingLayerDef: Defs.DefLayer | undefined)
{
    if (!editingLayerDef || editingLayerDef.type !== "object")
        return
        
    if (global.editors.mapEditing.showGrid === "background")
        drawGrid(
            state,
            "#444",
            0, 0,
            room.width, room.height,
            editingLayerDef.gridCellWidth,
            editingLayerDef.gridCellHeight)
}


export function renderObjectLayerForeground(
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    editingLayerDef: Defs.DefLayer | undefined)
{
    if (!editingLayerDef || editingLayerDef.type !== "object")
        return
        
    if (global.editors.mapEditing.showGrid === "foreground")
        drawGrid(
            state,
            "#444",
            0, 0,
            room.width, room.height,
            editingLayerDef.gridCellWidth,
            editingLayerDef.gridCellHeight)
            
    if (global.editors.mapEditing.tileTool === "draw" &&
        !state.onMouseMove)
    {
        const objectDef = Defs.getObjectDef(defs, global.editors.mapEditing.selectedObjectDefId)
        if (!objectDef)
            return

        const image = Images.getImageLazy(objectDef.imageSrc)
        if (!image)
            return

        const topleftX =
            MathUtils.snap(state.mouse.posInRoom.x, editingLayerDef.gridCellWidth) -
            (objectDef.interactionRect.width * objectDef.pivotPercent.x)

        const topleftY =
            MathUtils.snap(state.mouse.posInRoom.y, editingLayerDef.gridCellWidth) -
            (objectDef.interactionRect.height * objectDef.pivotPercent.y)

        const imageX = topleftX - objectDef.interactionRect.x
        const imageY = topleftY - objectDef.interactionRect.y

        const imageW = objectDef.imageRect.width
        const imageH = objectDef.imageRect.height
    
        state.ctx.save()
        state.ctx.globalAlpha = 0.5

        drawImage(
            state,
            image.element,
            objectDef.imageRect.x, objectDef.imageRect.y,
            objectDef.imageRect.width, objectDef.imageRect.height,
            imageX, imageY,
            imageW, imageH)

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
            tx1 * editingLayerDef.gridCellWidth,
            ty1 * editingLayerDef.gridCellHeight,
            (tx2 - tx1 + 1) * editingLayerDef.gridCellWidth,
            (ty2 - ty1 + 1) * editingLayerDef.gridCellHeight)

        state.ctx.restore()
    }
}


export function renderInteractionHandles(
    state: MapEditor.State)
{
    if (state.onMouseMove)
        return
    
    const handles = MapEditor.getInteractionHandles(state)

    for (const handle of handles)
    {
        const hovering = MathUtils.rectCenteredContains(handle, state.mouse.pos)

        if (!handle.visible && !hovering)
            continue

        const handleX1 = handle.x - handle.width / 2
        const handleY1 = handle.y - handle.height / 2

        if (handle.visible)
        {
            state.ctx.fillStyle = hovering ? "#2d2d2d" : "#242424"
            state.ctx.fillRect(handleX1, handleY1, handle.width, handle.height)
        }

        state.ctx.strokeStyle = hovering ? "#ffffff" : "#888888"
        state.ctx.strokeRect(handleX1, handleY1, handle.width, handle.height)
    }
}


function drawImage(
    state: MapEditor.State,
    image: CanvasImageSource,
    srcX: number,
    srcY: number,
    srcW: number,
    srcH: number,
    destX: number,
    destY: number,
    destW: number,
    destH: number)
{
    // Use a margin to avoid artifacts between tiles
    const srcMargin = 0.01
    const destMargin = 0

    state.ctx.drawImage(
        image,
        srcX + srcMargin,
        srcY + srcMargin,
        srcW - srcMargin * 2,
        srcH - srcMargin * 2,
        destX + destMargin,
        destY + destMargin,
        destW - destMargin * 2,
        destH - destMargin * 2)
}


export function drawGrid(
    state: MapEditor.State,
    strokeColor: string,
    x: number,
    y: number,
    width: number,
    height: number,
    gridCellWidth: number,
    gridCellHeight: number)
{
    state.ctx.save()

    // Draw dashed lines
    state.ctx.strokeStyle = strokeColor
    state.ctx.lineDashOffset = 1
    state.ctx.setLineDash([2, 2])

    state.ctx.beginPath()
    for (let x = gridCellWidth; x < width; x += gridCellWidth)
    {
        state.ctx.moveTo(x, 0)
        state.ctx.lineTo(x, height)
    }

    for (let y = gridCellHeight; y < height; y += gridCellHeight)
    {
        state.ctx.moveTo(0, y)
        state.ctx.lineTo(width, y)
    }
    state.ctx.stroke()

    state.ctx.restore()
}


export function drawTextBox(
    state: MapEditor.State,
    x: number,
    y: number,
    anchorX: number,
    anchorY: number,
    text: string,
    applyZoom?: boolean)
{
    const zoom = (applyZoom ? state.camera.zoom : 1)

    const fontSize = 14 / zoom
    state.ctx.font = fontSize + "px system-ui"

    const lines = text.split("\n")

    let textWidth = 0

    for (const line of lines)
    {
        const measure = state.ctx.measureText(line)
        textWidth = Math.max(textWidth, measure.width)
    }

    const lineHeight = fontSize + 2 / zoom
    const textHeight = lineHeight * lines.length

    const margin = 4 / zoom
    const boxW = textWidth + margin * 2
    const boxH = textHeight + margin * 2

    const boxX =
        anchorX == -1 ? -boxW :
        anchorX == 0 ? -boxW / 2 :
        0

    const boxY =
        anchorY == -1 ? -boxH :
        anchorY == 0 ? -boxH / 2 :
        0

    state.ctx.fillStyle = "#000"
    state.ctx.strokeStyle = "#fff"
    state.ctx.lineWidth = 1
    state.ctx.fillRect(x + boxX, y + boxY, boxW, boxH)
    state.ctx.strokeRect(x + boxX, y + boxY, boxW, boxH)

    state.ctx.fillStyle = "#fff"
    state.ctx.textAlign = "left"
    state.ctx.textBaseline = "top"

    for (let l = 0; l < lines.length; l++)
        state.ctx.fillText(
            lines[l],
            x + boxX + margin,
            y + boxY + margin + l * lineHeight)
}


export function drawTextBoxAroundRect(
    state: MapEditor.State,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    margin: number,
    anchorX: number,
    anchorY: number,
    text: string)
{
    margin /= state.camera.zoom

    drawTextBox(
        state,

        anchorX == -1 ? x1 - margin :
            anchorX == 1 ? x2 + margin :
            (x1 + x2) / 2,

        anchorY == -1 ? y1 - margin :
            anchorY == 1 ? y2 + margin :
            (y1 + y2) / 2,

        anchorX,
        anchorY,
        text)
}


export function drawInfoBox(
    state: MapEditor.State,
    text: string)
{
    state.ctx.save()
    state.ctx.resetTransform()

    const margin = 16
    const x = margin
    const y = state.canvasHeight - margin

    drawTextBox(
        state,
        x, y,
        1,
        -1,
        text,
        false)

    state.ctx.restore()
}