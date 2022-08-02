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
    

    state.onMouseMove = () =>
    {
        if (state.mouseDownLockedGrid)
            return

        const selectedObjs = [...state.objectSelection]
            .map(id => layer.objects[id])
            .filter(o => o !== undefined)

        const result = Map.cloneObjects(
            editor.map,
            state.roomId,
            global.editors.mapEditing.layerDefId,
            selectedObjs)

        state.objectSelection = new Set(result.newIds)

        editor.map = result.map

        MapEditor.setupObjectMove(state)
    }
}