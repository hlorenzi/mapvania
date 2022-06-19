import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupObjectMove(state: MapEditor.State)
{
    const editor = global.editors.editors[state.editorIndex] as Editors.EditorMap

    const layerDef = Defs.getLayerDef(
        editor.defs,
        global.editors.mapEditing.layerDefId)

    if (!layerDef)
        return

    const layer = Map.getRoomLayer(
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId)

    if (!layer || layer.type !== "object")
        return
    
    const objectsOrig = layer.objects


    state.onMouseMove = () =>
    {
        const newObjects = { ...objectsOrig }

        for (const objectId of state.objectSelection)
        {
            const originalObject = objectsOrig[objectId]
            if (!originalObject)
                continue

            const newObject = {
                ...originalObject,
                x: Math.round(originalObject.x + state.mouseDownDelta.posInRoom.x),
                y: Math.round(originalObject.y + state.mouseDownDelta.posInRoom.y),
            }

            if (!state.toolMoveWithoutSnap)
            {
                newObject.x = MathUtils.snapRound(newObject.x, layerDef.gridCellWidth)
                newObject.y = MathUtils.snapRound(newObject.y, layerDef.gridCellHeight)
            }

            newObjects[objectId] = newObject
        }

        const newLayer: Map.LayerObject = {
            ...layer as Map.LayerObject,
            objects: newObjects,
        }

        editor.map = Map.setRoomLayer(
            editor.map,
            state.roomId,
            global.editors.mapEditing.layerDefId,
            newLayer)
    }

    state.onMouseUp = () =>
    {
        global.editors.refreshToken.commit()
    }
}