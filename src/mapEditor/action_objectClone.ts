import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupObjectClone(state: MapEditor.State)
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
    
    const originalObjects = layer.objects


    state.onMouseMove = () =>
    {
        const mouseDist = MathUtils.pointDistance(
            { x: 0, y: 0 },
            state.mouseDownDelta.posInRoom)

        if (mouseDist < Math.max(layerDef.gridCellWidth, layerDef.gridCellHeight))
            return

        const clonedObjects: Map.LayerObject["objects"] = {}

        const originalSelection = [...state.objectSelection]
        state.objectSelection.clear()

        let nextIDs = editor.map.nextIDs

        for (const objectId of originalSelection)
        {
            const originalObject = originalObjects[objectId]
            if (!originalObject)
                continue

            const [newNextIDs, clonedObjId] = ID.getNextID(nextIDs)
            nextIDs = newNextIDs

            const clonedObject = {
                ...originalObject,
                id: clonedObjId,
            }

            clonedObjects[clonedObjId] = clonedObject
            state.objectSelection.add(clonedObjId)
        }

        const newLayer: Map.LayerObject = {
            ...layer as Map.LayerObject,
            objects: {
                ...layer.objects,
                ...clonedObjects,
            },
        }

        editor.map = Map.setRoomLayer(
            editor.map,
            state.roomId,
            global.editors.mapEditing.layerDefId,
            newLayer)

        editor.map = {
            ...editor.map,
            nextIDs,
        }

        MapEditor.setupObjectMove(state)
    }
}