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
                setupHandleVisibleProperty(state, visProp, null, denyAddingToList)
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
                newValue.x = MathUtils.snap(newValue.x, layerDef.gridCellWidth)
                newValue.y = MathUtils.snap(newValue.y, layerDef.gridCellHeight)
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

    state.onMouseUp = () =>
    {
        global.editors.refreshToken.commit()
    }
}