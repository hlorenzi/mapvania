import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupHandleResizeObject(
    state: MapEditor.State,
    objectId: ID.ID,
    directionX: number,
    directionY: number)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)

    const layer = Map.getRoomLayer(
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId)

    if (!layer || layer.type !== "object")
        return

    const layerDef = Defs.getLayerDef(editor.defs, layer.layerDefId)
    if (!layerDef || layerDef.type !== "object")
        return
    
    const object = layer.objects[objectId]
    if (!object)
        return

    const objectDef = Defs.getObjectDef(editor.defs, object.objectDefId)
    if (!objectDef)
        return

    const originalMap = editor.map


    state.onMouseMove = () =>
    {
        let newX1 = object.x - (object.width * objectDef.pivotPercent.x)
        let newX2 = newX1 + object.width

        if (directionX > 0)
        {
            newX2 += state.mouseDownDelta.pos.x
            if (!state.toolMoveWithoutSnap)
                newX2 = MathUtils.snapRound(newX2, layerDef.gridCellWidth)

            newX2 = newX1 + Math.max(
                newX2 - newX1,
                state.toolMoveWithoutSnap ? 1 : layerDef.gridCellWidth)
        }
        else if (directionX < 0)
        {
            newX1 += state.mouseDownDelta.pos.x
            if (!state.toolMoveWithoutSnap)
                newX1 = MathUtils.snapRound(newX1, layerDef.gridCellWidth)

            newX1 = newX2 - Math.max(
                newX2 - newX1,
                state.toolMoveWithoutSnap ? 1 : layerDef.gridCellWidth)
        }

        let newY1 = object.y - (object.height * objectDef.pivotPercent.y)
        let newY2 = newY1 + object.height

        if (directionY > 0)
        {
            newY2 += state.mouseDownDelta.pos.y
            if (!state.toolMoveWithoutSnap)
                newY2 = MathUtils.snapRound(newY2, layerDef.gridCellHeight)

            newY2 = newY1 + Math.max(
                newY2 - newY1,
                state.toolMoveWithoutSnap ? 1 : layerDef.gridCellHeight)
        }
        else if (directionY < 0)
        {
            newY1 += state.mouseDownDelta.pos.y
            if (!state.toolMoveWithoutSnap)
                newY1 = MathUtils.snapRound(newY1, layerDef.gridCellHeight)

            newY1 = newY2 - Math.max(
                newY2 - newY1,
                state.toolMoveWithoutSnap ? 1 : layerDef.gridCellHeight)
        }

        const newWidth = newX2 - newX1
        const newHeight = newY2 - newY1
        const newX = newX1 + (newWidth * objectDef.pivotPercent.x)
        const newY = newY1 + (newHeight * objectDef.pivotPercent.y)

        if (object.x == newX &&
            object.y == newY &&
            object.width == newWidth &&
            object.height == newHeight)
        {
            editor.map = originalMap
            return
        }

        const newObject = {
            ...object,
            x: newX,
            width: newWidth,
            y: newY,
            height: newHeight,
        }

        editor.map = Map.setRoomObject(
            editor.map,
            state.roomId,
            global.editors.mapEditing.layerDefId,
            objectId,
            newObject)
    }
}