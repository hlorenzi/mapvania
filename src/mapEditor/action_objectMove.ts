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
    
    const originalMap = editor.map
    const originalObjects = layer.objects


    state.onMouseMove = () =>
    {
        if (state.mouseDownLocked)
            return

        let hadChanges = false

        const newObjects = { ...originalObjects }

        for (const objectId of state.objectSelection)
        {
            const originalObject = originalObjects[objectId]
            if (!originalObject)
                continue

            let newX = Math.round(originalObject.x + state.mouseDownDelta.posInRoom.x)
            let newY = Math.round(originalObject.y + state.mouseDownDelta.posInRoom.y)

            if (!state.toolMoveWithoutSnap)
            {
                newX = MathUtils.snapRound(newX, layerDef.gridCellWidth)
                newY = MathUtils.snapRound(newY, layerDef.gridCellHeight)
            }

            if (originalObject.x == newX && originalObject.y == newY)
                continue

            hadChanges = true

            const newObject = {
                ...originalObject,
                x: newX,
                y: newY,
            }

            newObjects[objectId] = newObject
        }

        if (!hadChanges)
        {
            editor.map = originalMap
            return
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
}