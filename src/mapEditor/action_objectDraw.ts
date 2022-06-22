import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupObjectDraw(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const objectDefId = global.editors.mapEditing.selectedObjectDefId
    
    const layerDef = Defs.getLayerDef(
        editor.defs,
        global.editors.mapEditing.layerDefId)

    if (!layerDef)
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

    if (!layer || layer.type !== "object")
        return

    const [nextIDs, newObjectId] = ID.getNextID(editor.map.nextIDs)

    const newObject: Map.Obj = {
        ...Map.makeObject(
            editor.defs,
            editor.map,
            objectDefId,
        ),
        id: newObjectId,

        x: MathUtils.snap(state.mouse.posInRoom.x, layerDef.gridCellWidth),
        y: MathUtils.snap(state.mouse.posInRoom.y, layerDef.gridCellHeight),
    }

    layer = {
        ...layer,
        objects: {
            ...layer.objects,
            [newObjectId]: newObject,
        }
    }

    editor.map = Map.setRoomLayer(
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId,
        layer)

    editor.map = {
        ...editor.map,
        nextIDs,
    }

    editor.mapEditor.objectSelection.clear()
    editor.mapEditor.objectSelection.add(newObjectId)
    
    MapEditor.setupObjectMove(state)

    global.editors.mapEditing.tileTool = "move"
}