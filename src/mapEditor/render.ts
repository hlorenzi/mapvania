import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Filesystem from "../data/filesystem"
import * as Editors from "../data/editors"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Images from "../data/images"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"
import { CacheCanvas } from "../util/cacheCanvas"


let prevImagesRefreshToken = -1
let prevShowGrid = ""
let prevShowOtherLayers = ""
let prevLayerDefId = ""

let prevRenderedTileLayerContents: Map.LayerTile | undefined = undefined


export function render(state: MapEditor.State)
{
    state.cachedCanvases.advanceTimer(10)

    if (global.images.refreshToken.refreshValue !== prevImagesRefreshToken ||
        global.editors.mapEditing.showGrid !== prevShowGrid ||
        global.editors.mapEditing.showOtherLayers !== prevShowOtherLayers ||
        global.editors.mapEditing.layerDefId !== prevLayerDefId)
    {
        prevImagesRefreshToken = global.images.refreshToken.refreshValue
        prevShowGrid = global.editors.mapEditing.showGrid
        prevShowOtherLayers = global.editors.mapEditing.showOtherLayers
        prevLayerDefId = global.editors.mapEditing.layerDefId
        prevRenderedTileLayerContents = undefined
        Editors.clearCacheAll()
    }

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
    state.ctx.lineWidth = 1 / state.camera.zoom

    state.ctx.fillStyle = "#080808"
    state.ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight)

    state.ctx.translate(
        Math.floor(state.canvasWidth  / 2 - state.camera.pos.x) + 0.5,
        Math.floor(state.canvasHeight / 2 - state.camera.pos.y) + 0.5)
        
    state.ctx.scale(state.camera.zoom, state.camera.zoom)

    const editingLayerDef = Defs.getLayerDef(defs, global.editors.mapEditing.layerDefId)

    renderWorldLayerBkg(state, defs, editingLayerDef)

    let editingRoom: Map.Room | null = null
    const rooms = Object.values(map.rooms)
    for (const room of rooms)
    {
        if (room.id === state.roomId)
        {
            editingRoom = room
            continue
        }

        if (!isRectVisible(
                state,
                room.x, room.y,
                room.width, room.height))
            continue

        state.ctx.save()
        state.ctx.translate(room.x, room.y)
    
        renderRoomBkg(state.ctx, state, room)
        renderRoomCached(state, defs, room, false, true)

        state.ctx.restore()
    }

    if (editingRoom)
    {
        state.ctx.save()
        state.ctx.translate(editingRoom.x, editingRoom.y)
    
        renderRoomBkg(state.ctx, state, editingRoom)
        renderTileLayerBkg(state, defs, editingRoom, editingLayerDef)
        renderObjectLayerBkg(state, defs, editingRoom, editingLayerDef)
        renderRoom(state.ctx, state, defs, editingRoom, true, true)
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
    
    for (const room of rooms)
    {
        if (room.id === state.roomId)
            continue

        if (!isRectVisible(
                state,
                room.x, room.y,
                room.width, room.height))
            continue

        const strongBorder = global.editors.mapEditing.layerDefId === Editors.LAYERDEF_ID_MAP ?
            state.roomSelection.has(room.id) :
            false
    
        state.ctx.save()
        state.ctx.translate(room.x, room.y)
        renderRoomBorder(state.ctx, state, room, strongBorder)
        state.ctx.restore()
    }

    if (editingRoom)
    {
        state.ctx.save()
        state.ctx.translate(editingRoom.x, editingRoom.y)
        renderRoomBorder(state.ctx, state, editingRoom, true)
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
    ctx: CanvasRenderingContext2D,
    state: MapEditor.State,
    room: Map.Room)
{
    ctx.fillStyle = "#181818"
    ctx.fillRect(0, 0, room.width, room.height)
}


export function renderRoomCached(
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    roomIsSelected: boolean,
    useRoomCache: boolean)
{
    if (useRoomCache)
    {
        const cachedCanvas = state.cachedCanvases.get(
            room.id,
            room.width, room.height,
            (canvas, ctx) =>
            {
                ctx.imageSmoothingQuality = "low"
                ctx.imageSmoothingEnabled = false
                ctx.lineWidth = 1

                ctx.clearRect(0, 0, room.width, room.height)

                renderRoom(
                    ctx,
                    state,
                    defs,
                    room,
                    roomIsSelected,
                    useRoomCache)
            })
                    
        state.ctx.drawImage(
            cachedCanvas,
            0, 0)
    }
    else
    {
        renderRoom(
            state.ctx,
            state,
            defs,
            room,
            roomIsSelected,
            useRoomCache)
    }
}


export function renderRoom(
    ctx: CanvasRenderingContext2D,
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    roomIsSelected: boolean,
    useRoomCache: boolean)
{
    const editor = global.editors.editors[state.editorIndex] as Editors.EditorMap

    ctx.save()
    
    for (var i = defs.layerDefs.length - 1; i >= 0; i--)
    {
        const layerDef = defs.layerDefs[i]
        const layer = room.layers[layerDef.id]
        if (!layer)
            continue

        const isEditing = global.editors.mapEditing.layerDefId === layer.layerDefId

        ctx.save()

        if (global.editors.mapEditing.layerDefId !== Editors.LAYERDEF_ID_MAP &&
            !isEditing)
        {
            if (global.editors.mapEditing.showOtherLayers === "none")
            {
                ctx.restore()
                continue
            }
            else if (global.editors.mapEditing.showOtherLayers === "faded")
            {
                ctx.globalAlpha = 0.15
            }
        }

        if (layer.type === "tile" &&
            layerDef.type === "tile")
        {
            renderRoomTileLayerCached(
                ctx,
                state,
                defs,
                room,
                layer,
                layerDef,
                useRoomCache,
                useRoomCache && isEditing)
        }

        else if (layer.type === "object" &&
            layerDef.type === "object")
        {
            const hoverObject =
                state.roomId !== room.id ? undefined :
                global.editors.mapEditing.layerDefId !== layer.layerDefId ? undefined :
                state.onMouseMove ? undefined :
                    MapEditor.getObjectAt(state, state.mouse.posInRoom)
            
            for (const object of Object.values(layer.objects))
            {
                if (roomIsSelected)
                {
                    if (state.objectSelection.has(object.id) ||
                        hoverObject === object)
                        continue
                }

                renderObject(
                    ctx,
                    state,
                    defs,
                    object,
                    false,
                    false)
            }

            if (roomIsSelected)
            {
                for (const objectId of state.objectSelection)
                {
                    if (hoverObject?.id === objectId)
                        continue

                    const object = layer.objects[objectId]
                    if (!object)
                        continue

                    renderObject(
                        ctx,
                        state,
                        defs,
                        object,
                        false,
                        true)
                }

                if (hoverObject)
                {
                    renderObject(
                        ctx,
                        state,
                        defs,
                        hoverObject,
                        true,
                        state.objectSelection.has(hoverObject.id))
                }
            }
        }

        ctx.restore()
    }

    ctx.restore()
}


export function renderRoomTileLayerCached(
    ctx: CanvasRenderingContext2D,
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    layer: Map.LayerTile,
    layerDef: Defs.DefLayerTile,
    useRoomCache: boolean,
    useLayerCache: boolean)
{
    if (useRoomCache)
    {
        const cachedCanvas = state.cachedCanvases.get(
            room.id + ":" + layer.layerDefId,
            room.width, room.height,
            (canvas, cachedCtx) =>
            {
                cachedCtx.imageSmoothingQuality = "low"
                cachedCtx.imageSmoothingEnabled = false
                cachedCtx.lineWidth = 1

                cachedCtx.clearRect(0, 0, room.width, room.height)

                renderRoomTileLayer(
                    cachedCtx,
                    defs,
                    state,
                    room,
                    layer,
                    layerDef,
                    undefined,
                    false)
            })

        if (useLayerCache)
        {
            renderRoomTileLayer(
                cachedCanvas.getContext("2d")!,
                defs,
                state,
                room,
                layer,
                layerDef,
                prevRenderedTileLayerContents,
                true)

            prevRenderedTileLayerContents = layer
        }
                
        ctx.drawImage(
            cachedCanvas,
            0, 0)
    }
    else
    {
        renderRoomTileLayer(
            ctx,
            defs,
            state,
            room,
            layer,
            layerDef,
            undefined,
            false)
    }
}


export function renderRoomTileLayer(
    ctx: CanvasRenderingContext2D,
    defs: Defs.Defs,
    state: MapEditor.State,
    room: Map.Room,
    layer: Map.LayerTile,
    layerDef: Defs.DefLayerTile,
    lastRendered: Map.LayerTile | undefined,
    useLayerCache: boolean)
{
    const editor = global.editors.editors[state.editorIndex] as Editors.EditorMap

    let drawX1 = 0
    let drawX2 = layer.tileField.width - 1
    
    let drawY1 = 0
    let drawY2 = layer.tileField.height - 1

    if (useLayerCache &&
        lastRendered &&
        lastRendered.layerDefId === layer.layerDefId &&
        layer.tileField.width === lastRendered.tileField.width &&
        layer.tileField.height === lastRendered.tileField.height)
    {
        drawX1 = layer.tileField.width - 1
        drawX2 = 0

        drawY1 = layer.tileField.height - 1
        drawY2 = 0

        for (let y = 0; y < layer.tileField.height; y++)
        {
            for (let x = 0; x < layer.tileField.width; x++)
            {
                const index1 = Map.getTileFieldCellIndexForCell(layer.tileField, { x, y })!
                const tile1 =  layer.tileField.tiles[index1]
                const index2 = Map.getTileFieldCellIndexForCell(lastRendered.tileField, { x, y })!
                const tile2 =  lastRendered.tileField.tiles[index2]

                if (tile1?.tileId === tile2?.tileId &&
                    tile1?.tilesetDefId === tile2?.tilesetDefId)
                    continue

                drawX1 = Math.min(drawX1, x)
                drawX2 = Math.max(drawX2, x)
                
                drawY1 = Math.min(drawY1, y)
                drawY2 = Math.max(drawY2, y)
            }
        }
    }

    if (drawX2 < drawX1 ||
        drawY2 < drawY1)
        return

    let cachedTilesetDefId = ""
    let cachedTileset: Defs.DefTileset | undefined = undefined
    let cachedImage: Images.Image | undefined = undefined

    for (let y = drawY1; y <= drawY2; y++)
    {
        for (let x = drawX1; x <= drawX2; x++)
        {
            if (useLayerCache)
            {
                ctx.clearRect(
                    x * layerDef.gridCellWidth,
                    y * layerDef.gridCellHeight,
                    layerDef.gridCellWidth,
                    layerDef.gridCellHeight)
            }

            const tile = layer.tileField.tiles[y * layer.tileField.width + x]
            if (!tile)
                continue

            if (tile.tilesetDefId != cachedTilesetDefId)
            {
                cachedTilesetDefId = tile.tilesetDefId
                cachedTileset = Defs.getTileset(defs, tile.tilesetDefId)

                if (!cachedTileset)
                    continue

                const imagePath = Filesystem.resolveRelativePath(
                    editor.defsBasePath,
                    cachedTileset.imageSrc)
                
                cachedImage = Images.getImageLazy(imagePath)
            }
            
            if (!cachedTileset || !cachedImage)
                continue

            const imagePx = Defs.getPixelForTileIndex(cachedTileset, tile.tileId)

            drawImage(
                ctx,
                state,
                cachedImage.element,
                imagePx.x,
                imagePx.y,
                cachedTileset.gridCellWidth,
                cachedTileset.gridCellHeight,
                x * layerDef.gridCellWidth,
                y * layerDef.gridCellHeight,
                layerDef.gridCellWidth,
                layerDef.gridCellHeight)
        }
    }
}


export function renderRoomBorder(
    ctx: CanvasRenderingContext2D,
    state: MapEditor.State,
    room: Map.Room,
    strongBorder: boolean)
{
    ctx.save()

    ctx.strokeStyle = strongBorder ? "#fff" : "#888"
    ctx.lineWidth = state.ctx.lineWidth * (strongBorder ? 2 : 1)

    ctx.strokeRect(0, 0, room.width, room.height)
    ctx.restore()
}


function renderObject(
    ctx: CanvasRenderingContext2D,
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

    const editor = global.editors.editors[state.editorIndex] as Editors.EditorMap

    const imagePath = Filesystem.resolveRelativePath(
        editor.defsBasePath,
        objectDef.imageSrc)

    const image = Images.getImageLazy(imagePath)

    const topleftX = -(object.width * objectDef.pivotPercent.x)
    const topleftY = -(object.height * objectDef.pivotPercent.y)

    const imageX = topleftX - objectDef.interactionRect.x
    const imageY = topleftY - objectDef.interactionRect.y

    const imageW = object.width + (objectDef.imageRect.width - objectDef.interactionRect.width)
    const imageH = object.height + (objectDef.imageRect.height - objectDef.interactionRect.height)
    
    if (image)
        drawImage(
            ctx,
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
        ctx.save()
        ctx.setLineDash([2, 2])
        ctx.strokeStyle = "#ccc"
        ctx.strokeRect(
            object.x + topleftX, object.y + topleftY,
            object.width, object.height)
        ctx.restore()
    }

    if (selected)
    {
        ctx.fillStyle = "#fff4"
        ctx.fillRect(
            object.x + topleftX, object.y + topleftY,
            object.width, object.height)

        ctx.strokeStyle = "#fff"
        ctx.strokeRect(
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
                ctx.save()
                ctx.globalAlpha = 0.5
                
                if (image)
                    drawImage(
                        ctx,
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

                ctx.restore()
            }

            if (visProp.linksToIndexAsPath !== null)
            {
                ctx.save()
                ctx.strokeStyle = visProp.color
                ctx.lineWidth = handleSize / 4
                ctx.beginPath()
                ctx.moveTo(
                    visibleProperties[visProp.linksToIndexAsPath].value.x,
                    visibleProperties[visProp.linksToIndexAsPath].value.y)
                ctx.lineTo(
                    visProp.value.x,
                    visProp.value.y)
                ctx.stroke()
                ctx.restore()
            }
            else
            {
                ctx.save()
                ctx.strokeStyle = visProp.color
                ctx.lineWidth = handleSize / 6
                ctx.setLineDash([handleSize / 2, handleSize / 2])
                ctx.beginPath()
                ctx.moveTo(
                    object.x,
                    object.y)
                ctx.lineTo(
                    visProp.value.x,
                    visProp.value.y)
                ctx.stroke()
                ctx.restore()
            }

            if (visProp.value.type === "point")
            {
                ctx.fillStyle = visProp.color
                ctx.fillRect(
                    visProp.value.x - handleSize / 2,
                    visProp.value.y - handleSize / 2,
                    handleSize, handleSize)
            }
            else if (visProp.value.type === "rect")
            {
                ctx.save()
                ctx.strokeStyle = visProp.color
                ctx.lineWidth = handleSize / 4
                ctx.strokeRect(
                    visProp.value.x,
                    visProp.value.y,
                    visProp.value.width,
                    visProp.value.height)
                ctx.restore()

                ctx.fillStyle = visProp.color
                
                ctx.fillRect(
                    visProp.value.x - handleSize / 2,
                    visProp.value.y - handleSize / 2,
                    handleSize, handleSize)
                    
                ctx.fillRect(
                    visProp.value.x + visProp.value.width - handleSize / 2,
                    visProp.value.y - handleSize / 2,
                    handleSize, handleSize)
                    
                ctx.fillRect(
                    visProp.value.x + visProp.value.width - handleSize / 2,
                    visProp.value.y + visProp.value.height - handleSize / 2,
                    handleSize, handleSize)
                    
                ctx.fillRect(
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
    const cellW = defs.generalDefs.displayGrid.enabled ?
        defs.generalDefs.displayGrid.width :
        defs.generalDefs.roomWidthMultiple

    const cellH = defs.generalDefs.displayGrid.enabled ?
        defs.generalDefs.displayGrid.height :
        defs.generalDefs.roomHeightMultiple

    const dashSize = Math.max(
        Math.ceil(defs.generalDefs.roomWidthMultiple / state.camera.zoom),
        Math.ceil(defs.generalDefs.roomHeightMultiple / state.camera.zoom)) / 4

    state.ctx.strokeStyle = "#444"
    state.ctx.lineDashOffset = dashSize / 2
    state.ctx.setLineDash([dashSize, dashSize])

    const wView = state.canvasWidth  / state.camera.zoom
    const hView = state.canvasHeight / state.camera.zoom
    
    const horzCells = Math.ceil(wView / cellW) + 1
    const vertCells = Math.ceil(hView / cellH) + 1

    const cellXCenter = Math.floor(state.camera.pos.x / state.camera.zoom / cellW) * cellW
    const cellYCenter = Math.floor(state.camera.pos.y / state.camera.zoom / cellH) * cellH

    const cellXMin = cellXCenter - Math.ceil(horzCells / 2) * cellW
    const cellYMin = cellYCenter - Math.ceil(vertCells / 2) * cellH
    const cellXMax = cellXCenter + Math.ceil(horzCells / 2 + 1) * cellW
    const cellYMax = cellYCenter + Math.ceil(vertCells / 2 + 1) * cellH

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

    // Draw origin axes
    const xCenter = state.camera.pos.x / state.camera.zoom
    const yCenter = state.camera.pos.y / state.camera.zoom

    state.ctx.strokeStyle = "#840"
    state.ctx.beginPath()
    state.ctx.moveTo(xCenter - wView, 0)
    state.ctx.lineTo(xCenter + wView, 0)
    state.ctx.moveTo(0, yCenter - hView)
    state.ctx.lineTo(0, yCenter + hView)
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

    if (global.editors.mapEditing.tool === "draw" &&
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
        renderGridCached(
            state.ctx,
            state,
            "#444",
            room.width, room.height,
            editingLayerDef.displayGrid.enabled ?
                editingLayerDef.displayGrid.width :
                editingLayerDef.gridCellWidth,
            editingLayerDef.displayGrid.enabled ?
                editingLayerDef.displayGrid.height :
                editingLayerDef.gridCellHeight)
}


export function renderTileLayerForeground(
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    editingLayerDef: Defs.DefLayer | undefined)
{
    const editor = global.editors.editors[state.editorIndex] as Editors.EditorMap

    if (!editingLayerDef || editingLayerDef.type !== "tile")
        return

    if (global.editors.mapEditing.showGrid === "foreground")
        renderGridCached(
            state.ctx,
            state,
            "#444",
            room.width, room.height,
            editingLayerDef.displayGrid.enabled ?
                editingLayerDef.displayGrid.width :
                editingLayerDef.gridCellWidth,
            editingLayerDef.displayGrid.enabled ?
                editingLayerDef.displayGrid.height :
                editingLayerDef.gridCellHeight)

    if ((global.editors.mapEditing.tool === "draw" ||
        global.editors.mapEditing.tool === "fill") &&
        !state.onMouseMove)
    {
        state.ctx.save()
        state.ctx.globalAlpha = 0.5

        const brush = Defs.getTileBrushDef(defs, global.editors.mapEditing.tileBrushDefId)
        if (brush)
        {
            for (const _ of [0])
            {
                const fillType = Map.getBrushTileTypeForMousePosition(
                    defs,
                    brush,
                    editingLayerDef,
                    state.mouse.posInRoom)
    
                const tileIndex = Defs.getTileBrushDefaultTile(
                    defs,
                    brush,
                    fillType)

                if (tileIndex === undefined)
                    continue

                const tileset = Defs.getTileset(defs, brush.tilesetDefId)
                if (!tileset)
                    continue

                const imagePath = Filesystem.resolveRelativePath(
                    editor.defsBasePath,
                    tileset.imageSrc)
                
                const image = Images.getImageLazy(imagePath)
                if (!image)
                    continue

                const imagePx = Defs.getPixelForTileIndex(tileset, tileIndex)

                drawImage(
                    state.ctx,
                    state,
                    image.element,
                    imagePx.x, imagePx.y,
                    tileset.gridCellWidth, tileset.gridCellHeight,
                    state.mouse.tile.x * editingLayerDef.gridCellWidth,
                    state.mouse.tile.y * editingLayerDef.gridCellHeight,
                    editingLayerDef.gridCellWidth, editingLayerDef.gridCellHeight)
            }
        }
        else
        {
            for (const cell of Map.enumerateTileFieldCellsCentered(global.editors.mapEditing.tileStamp))
            {
                if (!cell.tile)
                    continue

                const tileset = Defs.getTileset(defs, cell.tile.tilesetDefId)
                if (!tileset)
                    continue

                const imagePath = Filesystem.resolveRelativePath(
                    editor.defsBasePath,
                    tileset.imageSrc)
                
                const image = Images.getImageLazy(imagePath)
                if (!image)
                    continue

                const imagePx = Defs.getPixelForTileIndex(tileset, cell.tile.tileId)

                drawImage(
                    state.ctx,
                    state,
                    image.element,
                    imagePx.x, imagePx.y,
                    tileset.gridCellWidth, tileset.gridCellHeight,
                    (state.mouse.tile.x + cell.x) * editingLayerDef.gridCellWidth,
                    (state.mouse.tile.y + cell.y) * editingLayerDef.gridCellHeight,
                    editingLayerDef.gridCellWidth, editingLayerDef.gridCellHeight)
            }
        }

        state.ctx.restore()
    }
    else if (global.editors.mapEditing.tool === "erase")
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
        renderGridCached(
            state.ctx,
            state,
            "#444",
            room.width, room.height,
            editingLayerDef.displayGrid.enabled ?
                editingLayerDef.displayGrid.width :
                editingLayerDef.gridCellWidth,
            editingLayerDef.displayGrid.enabled ?
                editingLayerDef.displayGrid.height :
                editingLayerDef.gridCellHeight)
}


export function renderObjectLayerForeground(
    state: MapEditor.State,
    defs: Defs.Defs,
    room: Map.Room,
    editingLayerDef: Defs.DefLayer | undefined)
{
    const editor = global.editors.editors[state.editorIndex] as Editors.EditorMap

    if (!editingLayerDef || editingLayerDef.type !== "object")
        return
        
    if (global.editors.mapEditing.showGrid === "foreground")
        renderGridCached(
            state.ctx,
            state,
            "#444",
            room.width, room.height,
            editingLayerDef.displayGrid.enabled ?
                editingLayerDef.displayGrid.width :
                editingLayerDef.gridCellWidth,
            editingLayerDef.displayGrid.enabled ?
                editingLayerDef.displayGrid.height :
                editingLayerDef.gridCellHeight)
            
    if (global.editors.mapEditing.tool === "draw" &&
        !state.onMouseMove)
    {
        const objectDef = Defs.getObjectDef(defs, global.editors.mapEditing.objectDefId)
        if (!objectDef)
            return

        const imagePath = Filesystem.resolveRelativePath(
            editor.defsBasePath,
            objectDef.imageSrc)
        
        const image = Images.getImageLazy(imagePath)
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
            state.ctx,
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


export function positionXToScreen(state: MapEditor.State, x: number)
{
    return x * state.camera.zoom +
        (Math.floor(state.canvasWidth / 2 - state.camera.pos.x) + 0.5)
}


export function positionYToScreen(state: MapEditor.State, y: number)
{
    return y * state.camera.zoom +
        (Math.floor(state.canvasHeight / 2 - state.camera.pos.y) + 0.5)
}


export function isRectVisible(
    state: MapEditor.State,
    x: number,
    y: number,
    width: number,
    height: number)
{
    const margin = 0

    const screenX1 = positionXToScreen(state, x)
    const screenX2 = positionXToScreen(state, x + width)
    const screenY1 = positionYToScreen(state, y)
    const screenY2 = positionYToScreen(state, y + height)

    return (screenX2 >= margin &&
        screenX1 < state.canvasWidth - margin &&
        screenY2 >= margin &&
        screenY1 < state.canvasHeight - margin)
}


function drawImage(
    ctx: CanvasRenderingContext2D,
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

    ctx.drawImage(
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


export function renderGridCached(
    ctx: CanvasRenderingContext2D,
    state: MapEditor.State,
    strokeColor: string,
    width: number,
    height: number,
    gridCellWidth: number,
    gridCellHeight: number)
{
    const scale = MathUtils.snapRound(Math.max(1 / 16, Math.min(4, state.camera.zoom)), 1 / 16)

    const cacheKey =
        strokeColor + ":" +
        state.camera.zoom + ":" +
        width + ":" + height + ":" +
        gridCellWidth + ":" + gridCellHeight

    const cachedCanvas = state.cachedCanvases.get(
        cacheKey,
        width * scale, height * scale,
        (canvas, cachedCtx) =>
        {
            cachedCtx.imageSmoothingQuality = "low"
            cachedCtx.imageSmoothingEnabled = false
            cachedCtx.lineWidth = 1 / scale

            cachedCtx.clearRect(0, 0, width * scale, height * scale)

            drawGrid(
                cachedCtx,
                strokeColor,
                scale,
                width,
                height,
                gridCellWidth,
                gridCellHeight)
        })

    ctx.drawImage(
        cachedCanvas,
        0, 0,
        width, height)
}


export function drawGrid(
    ctx: CanvasRenderingContext2D,
    strokeColor: string,
    scale: number,
    width: number,
    height: number,
    gridCellWidth: number,
    gridCellHeight: number)
{
    ctx.save()
    ctx.translate(-0.5, -0.5)
    ctx.scale(scale, scale)

    ctx.strokeStyle = strokeColor
    ctx.lineDashOffset = 1
    ctx.setLineDash([2, 2])

    ctx.beginPath()
    for (let x = gridCellWidth; x < width; x += gridCellWidth)
    {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
    }

    for (let y = gridCellHeight; y < height; y += gridCellHeight)
    {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
    }
    ctx.stroke()

    ctx.restore()
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