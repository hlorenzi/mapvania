import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Properties from "../data/properties"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupHandleVisibleProperty(
    state: MapEditor.State,
    visProp: MapEditor.ObjectVisibleProperty,
    sideX: number,
    sideY: number,
    listPrevDirection: MathUtils.Point | null,
    denyAddingToList?: boolean)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const room = editor.map.rooms[state.roomId]

    const layer = Map.getRoomLayer(
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId)

    if (!layer || layer.type !== "object")
        return

    const layerDef = Defs.getLayerDef(editor.defs, layer.layerDefId)
    if (!layerDef || layerDef.type !== "object")
        return
    
    const object = layer.objects[visProp.objectId]
    if (!object)
        return

    const originalValue = Properties.getValueByFullId(
        object.properties,
        visProp.propertyId)

    state.onMouseMove = () =>
    {
        if (state.mouseDownLocked)
            return

        if (state.toolDeleteFromList)
        {
            editor.map = Map.setRoomObject(
                editor.map,
                state.roomId,
                global.editors.mapEditing.layerDefId,
                visProp.objectId,
                {
                    ...object,
                    properties: Properties.deleteValueFromListByFullId(
                        object.properties,
                        visProp.propertyId) as any
                })

            state.onMouseMove = () => {}
        }

        else if (state.toolAddToList && !denyAddingToList)
        {
            const mouseDist = MathUtils.pointDistance(
                visProp.value,
                state.mouse.posInRoom)

            if (mouseDist > Math.max(layerDef.gridCellWidth, layerDef.gridCellHeight))
            {
                denyAddingToList = true

                const before = !listPrevDirection ? false : 0 > MathUtils.dotProduct(
                    listPrevDirection,
                    {
                        x: state.mouse.posInRoom.x - visProp.value.x,
                        y: state.mouse.posInRoom.y - visProp.value.y,
                    })

                const [duplicated, newFullId] = Properties.duplicateValueFromListByFullId(
                    object.properties,
                    visProp.propertyId,
                    before)

                editor.map = Map.setRoomObject(
                    editor.map,
                    state.roomId,
                    global.editors.mapEditing.layerDefId,
                    visProp.objectId,
                    {
                        ...object,
                        properties: duplicated as any
                    })

                visProp.propertyId = newFullId
                setupHandleVisibleProperty(
                    state,
                    visProp,
                    sideX, sideY,
                    null, denyAddingToList)
            }
        }

        else if (visProp.value.type === "point" &&
            (!state.toolAddToList || denyAddingToList))
        {
            const newValue = {
                x: Math.round(
                    ((originalValue as any)?.x ?? 0) +
                    state.mouseDownDelta.pos.x),
                y: Math.round(
                    ((originalValue as any)?.y ?? 0) +
                    state.mouseDownDelta.pos.y),
            }

            if (!state.toolMoveWithoutSnap)
            {
                newValue.x = MathUtils.snapRound(newValue.x, layerDef.gridCellWidth)
                newValue.y = MathUtils.snapRound(newValue.y, layerDef.gridCellHeight)
            }
    
            editor.map = Map.setRoomObject(
                editor.map,
                state.roomId,
                global.editors.mapEditing.layerDefId,
                visProp.objectId,
                {
                    ...object,
                    properties: Properties.setValueByFullId(
                        object.properties,
                        visProp.propertyId,
                        newValue) as any
                })
        }

        else if (visProp.value.type === "rect" &&
            (!state.toolAddToList || denyAddingToList))
        {
            let newX1 = (originalValue as any)?.x
            let newX2 = newX1 + (originalValue as any)?.width
            let newY1 = (originalValue as any)?.y
            let newY2 = newY1 + (originalValue as any)?.height

            if (sideX < 0)
                newX1 = Math.round(newX1 + state.mouseDownDelta.pos.x)
            else if (sideX > 0)
                newX2 = Math.round(newX2 + state.mouseDownDelta.pos.x)

            if (sideY < 0)
                newY1 = Math.round(newY1 + state.mouseDownDelta.pos.y)
            else if (sideY > 0)
                newY2 = Math.round(newY2 + state.mouseDownDelta.pos.y)

            if (!state.toolMoveWithoutSnap)
            {
                if (sideX < 0)
                    newX1 = MathUtils.snapRound(newX1, layerDef.gridCellWidth)
                else if (sideX > 0)
                    newX2 = MathUtils.snapRound(newX2, layerDef.gridCellWidth)
                    
                if (sideY < 0)
                    newY1 = MathUtils.snapRound(newY1, layerDef.gridCellHeight)
                else if (sideY > 0)
                    newY2 = MathUtils.snapRound(newY2, layerDef.gridCellHeight)
            }

            const newX = Math.min(newX1, newX2)
            const newY = Math.min(newY1, newY2)

            const newValue: MathUtils.RectWH = {
                x: newX,
                y: newY,
                width: Math.max(newX1, newX2) - newX,
                height: Math.max(newY1, newY2) - newY,
            }
    
            editor.map = Map.setRoomObject(
                editor.map,
                state.roomId,
                global.editors.mapEditing.layerDefId,
                visProp.objectId,
                {
                    ...object,
                    properties: Properties.setValueByFullId(
                        object.properties,
                        visProp.propertyId,
                        newValue) as any
                })
        }
                
        global.editors.refreshToken.commit()
    }
}