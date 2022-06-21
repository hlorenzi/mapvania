import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"


export function setupTileDraw(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const tileStamp = global.editors.mapEditing.tileStamp

    
    let lastPlacedTile = { x: -100000, y: -100000 }

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


        if (state.toolMoveWithoutSnap &&
            Math.abs(state.mouse.tile.x - lastPlacedTile.x) < tileStamp.width &&
            Math.abs(state.mouse.tile.y - lastPlacedTile.y) < tileStamp.height)
            return

        for (const cell of Map.enumerateTileFieldCellsCentered(tileStamp))
        {
            const mouseCell = {
                x: state.mouse.tile.x + cell.x,
                y: state.mouse.tile.y + cell.y,
            }

            const cellIndex = Map.getTileFieldCellIndexForCell(layer.tileField, mouseCell)
            if (cellIndex === undefined)
                continue

            layer = {
                ...layer,
                tileField: {
                    ...layer.tileField,
                    tiles: [
                        ...layer.tileField.tiles.slice(0, cellIndex),
                        cell.tile,
                        ...layer.tileField.tiles.slice(cellIndex + 1),
                    ]
                }
            }
        }

        lastPlacedTile = state.mouse.tile
        
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