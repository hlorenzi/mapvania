import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"


export function setupTileSelect(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)

    state.rectSelection =
    {
        tile1: state.mouse.tile,
        tile2: state.mouse.tile,
    }

    state.onMouseMove = () =>
    {
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

        state.rectSelection!.tile2 = state.mouse.tile
    }
}