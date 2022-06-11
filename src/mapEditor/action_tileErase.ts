import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"


export function setupTileErase(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)

    state.rectSelection = null

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

        const cellIndex = Map.getTileFieldCellIndexForCell(layer.tileField, state.mouse.tile)
        if (cellIndex === undefined)
            return

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

        editor.map = Map.setRoomLayer(
            editor.map,
            state.roomId,
            global.editors.mapEditing.layerDefId,
            layer)
    }

    state.onMouseUp = () =>
    {
        global.editors.refreshToken.commit()
    }
}