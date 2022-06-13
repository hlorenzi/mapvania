import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Properties from "../data/properties"
import * as Editors from "../data/editors"
import * as UI from "../ui"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


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

    toolMoveWithoutSnap: boolean
    toolAddToList: boolean
    toolDeleteFromList: boolean

    camera:
    {
        pos: { x: number, y: number }
        zoom: number
    }

    mouse:
    {
        posRaw: { x: number, y: number }
        pos: { x: number, y: number }
        posInRoom: { x: number, y: number }
        tile: { x: number, y: number }
    }

    mouseDownOrigin:
    {
        posRaw: { x: number, y: number }
        pos: { x: number, y: number }
        posInRoom: { x: number, y: number }
        tile: { x: number, y: number }
    }

    mouseDownDelta:
    {
        posRaw: { x: number, y: number }
        pos: { x: number, y: number }
        posInRoom: { x: number, y: number }
        tile: { x: number, y: number }
    }

    rectSelection: null |
    {
        tile1: { x: number, y: number }
        tile2: { x: number, y: number }
    }

    stageSelection: Set<ID.ID>
    objectSelection: Set<ID.ID>
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

        toolMoveWithoutSnap: false,
        toolAddToList: false,
        toolDeleteFromList: false,

        camera:
        {
            pos: { x: 0, y: 0 },
            zoom: 1,
        },

        mouse:
        {
            posRaw: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
            posInRoom: { x: 0, y: 0 },
            tile: { x: 0, y: 0 },
        },
        
        mouseDownOrigin:
        {
            posRaw: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
            posInRoom: { x: 0, y: 0 },
            tile: { x: 0, y: 0 },
        },

        mouseDownDelta:
        {
            posRaw: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
            posInRoom: { x: 0, y: 0 },
            tile: { x: 0, y: 0 },
        },

        rectSelection: null,

        stageSelection: new Set<ID.ID>(),
        objectSelection: new Set<ID.ID>(),
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


export interface InteractionHandle
{
    x: number
    y: number
    width: number
    height: number

    visible: boolean

    onMouseDown: (state: State) => void
}


export function getInteractionHandles(state: State)
{
    const handles: InteractionHandle[] = []

    const defs = (global.editors.editors[state.editorIndex] as Editors.EditorMap).defs
    const map = (global.editors.editors[state.editorIndex] as Editors.EditorMap).map
    const room = map.rooms[state.roomId]

    if (room)
    {
        const sidesX = [-1,  0,  1, -1, 1, -1, 0, 1]
        const sidesY = [-1, -1, -1,  0, 0,  1, 1, 1]

        const margin = 12 / state.camera.zoom

        const roomX1 = room.x - margin
        const roomY1 = room.y - margin
        const roomX2 = room.x + margin + room.width
        const roomY2 = room.y + margin + room.height
        const roomXCenter = room.x + room.width / 2
        const roomYCenter = room.y + room.height / 2

        for (let i = 0; i < sidesX.length; i++)
        {
            handles.push({
                x: sidesX[i] == -1 ? roomX1 : sidesX[i] == 0 ? roomXCenter : roomX2,
                y: sidesY[i] == -1 ? roomY1 : sidesY[i] == 0 ? roomYCenter : roomY2,
                width: 12 / state.camera.zoom,
                height: 12 / state.camera.zoom,

                visible: true,
                onMouseDown: (s) => MapEditor.setupHandleResizeRoom(s, sidesX[i], sidesY[i]),
            })
        }

        const layer = Map.getRoomLayer(
            map,
            state.roomId,
            global.editors.mapEditing.layerDefId)

        if (layer && layer.type === "object")
        {
            for (const objectId of state.objectSelection)
            {
                const object = layer.objects[objectId]
                if (!object)
                    continue
                
                const visibleProperties = getObjectVisibleProperties(
                    state, object)

                for (let i = 0; i < visibleProperties.length; i++)
                {
                    const visProp = visibleProperties[i]
                    const prevDirection =
                        visProp.linksToIndexAsPath === null ? null :
                        {
                            x: visProp.value.x - visibleProperties[visProp.linksToIndexAsPath].value.x,
                            y: visProp.value.y - visibleProperties[visProp.linksToIndexAsPath].value.y,
                        }

                    if (visProp.value.type === "point")
                    {
                        handles.push({
                            x: room.x + visProp.value.x,
                            y: room.y + visProp.value.y,
                            width: 12 / state.camera.zoom,
                            height: 12 / state.camera.zoom,

                            visible: false,
                            onMouseDown: (s) => MapEditor.setupHandleVisibleProperty(s, visProp, prevDirection),
                        })
                    }
                }
            }
        }
    }

    return handles
}


export interface ObjectVisibleProperty
{
    objectId: ID.ID,
    propertyId: Properties.FieldFullId
    color: string
    showGhost: boolean
    value: ObjectVisiblePropertyValue
    linksToIndexAsPath: number | null
}


export type ObjectVisiblePropertyValue =
    { type: "point" } & MathUtils.Point |
    { type: "rect" } & MathUtils.RectWH


export function getObjectVisibleProperties(state: State, object: Map.Obj)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const objectDef = Defs.getObjectDef(editor.defs, object.objectDefId)!
    const propertyDef = Defs.getObjectPropertyDefs(editor.defs, objectDef)

    const result: ObjectVisibleProperty[] = []

    for (const field of propertyDef)
    {
        getObjectVisiblePropertiesRecursive(
            state,
            object,
            result,
            [field.id],
            field,
            object.properties[field.id],
            null)
    }

    return result
}


export function getObjectVisiblePropertiesRecursive(
    state: State,
    object: Map.Obj,
    result: ObjectVisibleProperty[],
    fieldId: Properties.FieldFullId,
    field: Properties.DefField,
    value: Properties.FieldValue,
    linksToIndexAsPath: number | null)
{
    if (field.type === "point")
    {
        const valuePoint = value as Properties.FieldValuePoint
        if (!valuePoint)
            return

        result.push({
            objectId: object.id,
            propertyId: fieldId,
            color: "#ffff00",
            showGhost: field.showGhost,
            value: {
                type: "point",
                x: valuePoint.x + (field.relative ? object.x : 0),
                y: valuePoint.y + (field.relative ? object.y : 0),
            },
            linksToIndexAsPath,
        })
    }

    else if (field.type === "rect")
    {
        const valueRect = value as Properties.FieldValueRect
        if (!valueRect)
            return

        result.push({
            objectId: object.id,
            propertyId: fieldId,
            color: "#ffcc00",
            showGhost: false,
            value: {
                type: "rect",
                x: valueRect.x + (field.relative ? object.x : 0),
                y: valueRect.y + (field.relative ? object.y : 0),
                width: valueRect.width,
                height: valueRect.height,
            },
            linksToIndexAsPath,
        })
    }

    else if (field.type === "struct")
    {
        const valueStruct = value as Properties.FieldValueStruct
        if (!valueStruct)
            return

        for (const subfield of field.fields)
        {
            getObjectVisiblePropertiesRecursive(
                state, object, result,
                [...fieldId, subfield.id],
                subfield, valueStruct[subfield.id],
                linksToIndexAsPath)
        }
    }

    else if (field.type === "enum")
    {
        const valueEnum = value as Properties.FieldValueEnum
        if (!valueEnum)
            return

        const variantField = field.variants.find(v => v.id === valueEnum.variantId)
        if (!variantField)
            return

        getObjectVisiblePropertiesRecursive(
            state, object, result,
            fieldId, variantField, valueEnum.value,
            linksToIndexAsPath)
    }

    else if (field.type === "list")
    {
        const valueList = value as Properties.FieldValueList
        if (!valueList)
            return

        for (let i = 0; i < valueList.length; i++)
        {
            const linksToIndex =
                !field.showPath ? null :
                i == 0 ? null :
                result.length - 1
            
            getObjectVisiblePropertiesRecursive(
                state, object, result,
                [...fieldId, i],
                field.element, valueList[i],
                linksToIndex)
        }
    }
}


export function onMouseDown(state: State, ev: MouseEvent)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const defs = editor.defs
    const map = editor.map
    const editingLayerDef = Defs.getLayerDef(defs, global.editors.mapEditing.layerDefId)
    const layer = Map.getRoomLayer(map, state.roomId, global.editors.mapEditing.layerDefId)

    ev.preventDefault()
    
    if (state.onMouseMove)
        return

    state.mouseDownOrigin =
    {
        posRaw: state.mouse.posRaw,
        pos: state.mouse.pos,
        posInRoom: state.mouse.posInRoom,
        tile: state.mouse.tile,
    }

    const handles = getInteractionHandles(state)
    const hoveringHandle = handles.find(h => MathUtils.rectCenteredContains(h, state.mouse.pos))

    if (ev.button != 0)
    {
        MapEditor.setupPan(state)
    }
    else if (hoveringHandle)
    {
        hoveringHandle.onMouseDown(state)
    }
    else
    {
        if (global.editors.mapEditing.layerDefId === Editors.LAYERDEF_ID_WORLD)
        {
            const hoverRoom = Object.values(map.rooms)
                .find(r => MathUtils.rectContains(r, state.mouse.pos))
            
            if (!ev.ctrlKey &&
                (!hoverRoom || !state.stageSelection.has(hoverRoom.id)))
            {
                state.roomId = ""
                state.stageSelection.clear()
            }

            if (hoverRoom)
            {
                if (ev.ctrlKey && state.stageSelection.has(hoverRoom.id))
                    state.stageSelection.delete(hoverRoom.id)
                else
                    state.stageSelection.add(hoverRoom.id)

                state.roomId = hoverRoom.id
            }

            if (global.editors.mapEditing.tileTool === "move")
                MapEditor.setupWorldMove(state)

            else if (global.editors.mapEditing.tileTool === "draw")
                MapEditor.setupWorldDraw(state)
        }
        else
        {
            const hoverRoom = Object.values(map.rooms)
                .find(r => MathUtils.rectContains(r, state.mouse.pos))
            
            if (hoverRoom && hoverRoom.id !== state.roomId)
            {
                state.roomId = hoverRoom.id
            }
            else
            {
                editor.map = Map.ensureRoomLayer(
                    editor.defs,
                    editor.map,
                    state.roomId,
                    global.editors.mapEditing.layerDefId)
                    
                if (editingLayerDef && editingLayerDef.type === "tile")
                {
                    if (global.editors.mapEditing.tileTool === "draw")
                        MapEditor.setupTileDraw(state)

                    else if (global.editors.mapEditing.tileTool === "erase")
                        MapEditor.setupTileErase(state)

                    else if (global.editors.mapEditing.tileTool === "select")
                        MapEditor.setupTileSelect(state)
                }
                else if (
                    editingLayerDef && editingLayerDef.type === "object" &&
                    layer && layer.type === "object")
                {
                    const hoverObject = Object.values(layer.objects)
                        .find(r => MathUtils.rectContains(r, state.mouse.posInRoom))
                    
                    if (!ev.ctrlKey &&
                        (!hoverObject || !state.objectSelection.has(hoverObject.id)))
                    {
                        state.objectSelection.clear()
                    }
                    
                    if (hoverObject)
                    {
                        if (ev.ctrlKey && state.objectSelection.has(hoverObject.id))
                            state.objectSelection.delete(hoverObject.id)
                        else
                            state.objectSelection.add(hoverObject.id)
                    }

                    if (global.editors.mapEditing.tileTool === "move")
                        MapEditor.setupObjectMove(state)

                    else if (global.editors.mapEditing.tileTool === "draw")
                        MapEditor.setupObjectDraw(state)

                    else if (global.editors.mapEditing.tileTool === "select")
                        MapEditor.setupTileSelect(state)
                }
            }
        }
    }

    onMouseMove(state, ev)
}


export function onMouseMove(state: State, ev: MouseEvent)
{
    const defs = (global.editors.editors[state.editorIndex] as Editors.EditorMap).defs
    const map = (global.editors.editors[state.editorIndex] as Editors.EditorMap).map
    const room = map.rooms[state.roomId]

    const canvasRect = state.canvas.getBoundingClientRect()

    state.mouse.posRaw = {
        x: ev.clientX - canvasRect.left,
        y: ev.clientY - canvasRect.top,
    }

    state.mouse.pos = {
        x: (state.mouse.posRaw.x - state.canvasWidth  / 2 + state.camera.pos.x) / state.camera.zoom,
        y: (state.mouse.posRaw.y - state.canvasHeight / 2 + state.camera.pos.y) / state.camera.zoom,
    }

    state.mouse.posInRoom = {
        x: state.mouse.pos.x - (room?.x ?? 0),
        y: state.mouse.pos.y - (room?.y ?? 0),
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

    state.mouseDownDelta.posInRoom = {
        x: state.mouse.posInRoom.x - state.mouseDownOrigin.posInRoom.x,
        y: state.mouse.posInRoom.y - state.mouseDownOrigin.posInRoom.y,
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

    if (state.onMouseUp)
        state.onMouseUp(state)

    if (state.onMouseMove)
        Editors.historyAdd(state.editorIndex)

    state.onMouseMove = null
    state.onMouseUp = null
    state.onRenderWorldTool = null
    
    MapEditor.render(state)
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


export function onKey(state: State, ev: KeyboardEvent, down: boolean)
{
    const key = ev.key.toLowerCase()
    console.log(key, down)

    switch (key)
    {
        case "c":
            if (down && ev.ctrlKey)
            {
                copyTileSelection(state)
                state.rectSelection = null
                MapEditor.render(state)
                ev.preventDefault()
            }
            break

        case "x":
            if (down && ev.ctrlKey)
            {
                copyTileSelection(state)
                eraseTileSelection(state)
                Editors.historyAdd(state.editorIndex)
                state.rectSelection = null
                MapEditor.render(state)
                ev.preventDefault()
            }
            break

        case "d":
        case "delete":
        case "backspace":
            if (state.onMouseMove)
            {
                state.toolDeleteFromList = down
                state.onMouseMove(state)
                MapEditor.render(state)
                ev.preventDefault()
            }
            else if (down)
            {
                eraseTileSelection(state)
                Editors.historyAdd(state.editorIndex)
                state.rectSelection = null
                state.toolDeleteFromList = false
                MapEditor.render(state)
                ev.preventDefault()
            }
            break

        case "q":
        case "control":
            state.toolMoveWithoutSnap = down
            ev.preventDefault()
            break

        case "a":
        case "alt":
            state.toolAddToList = down
            ev.preventDefault()
            break
    }
}


export function copyTileSelection(state: State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)

    if (!state.rectSelection)
        return

    editor.map = Map.ensureRoomLayer(
        editor.defs,
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId)

    let layer = Map.getRoomLayer(
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId)

    if (!layer || layer.type !== "tile")
        return

    const tx1 = Math.min(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
    const tx2 = Math.max(state.rectSelection.tile1.x, state.rectSelection.tile2.x)
    const ty1 = Math.min(state.rectSelection.tile1.y, state.rectSelection.tile2.y)
    const ty2 = Math.max(state.rectSelection.tile1.y, state.rectSelection.tile2.y)

    const tileField: Map.TileField =
    {
        width: tx2 - tx1 + 1,
        height: ty2 - ty1 + 1,
        tiles: [],
    }

    for (let y = ty1; y <= ty2; y++)
    {
        for (let x = tx1; x <= tx2; x++)
        {
            const cellIndex = Map.getTileFieldCellIndexForCell(layer.tileField, { x, y })
            if (cellIndex === undefined)
                tileField.tiles.push(undefined)
            else
                tileField.tiles.push(layer.tileField.tiles[cellIndex])
        }
    }

    global.editors.mapEditing.tileStamp = tileField
    global.editors.mapEditing.tilesetStampSet.clear()
    global.editors.mapEditing.tileTool = "draw"
    global.editors.refreshToken.commit()
}


export function eraseTileSelection(state: State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)

    if (!state.rectSelection)
        return
    
    editor.map = Map.ensureRoomLayer(
        editor.defs,
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId)

    let layer = Map.getRoomLayer(
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId)
    
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
            const cellIndex = Map.getTileFieldCellIndexForCell(layer.tileField, { x, y })
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

    editor.map = Map.setRoomLayer(
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId,
        layer)

    global.editors.refreshToken.commit()
}