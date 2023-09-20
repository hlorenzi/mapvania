import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"


export function setupTileReplace(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const tileStamp = global.editors.mapEditing.tileStamp
    const brush = Defs.getTileBrushDef(editor.defs, global.editors.mapEditing.tileBrushDefId)

    
    let lastPlacedTile = { x: -100000, y: -100000 }
    let drawnMultiple = false

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

        const layerDef = Defs.getLayerDef(editor.defs, layer.layerDefId)
        if (!layerDef || layerDef.type !== "tile")
            return


        if (!brush)
        {
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

                const originalTile = Map.getTile(layer, mouseCell)

                for (const replaceCell of Map.enumerateTileFieldCells(layer.tileField))
                {
                    const replaceTile = Map.getTile(layer, replaceCell)

                    const isSameTile =
                        (originalTile === undefined &&
                            replaceTile === undefined) ||
                        (originalTile?.tilesetDefId === replaceTile?.tilesetDefId &&
                            originalTile?.tileId === replaceTile?.tileId)
                        
                    if (isSameTile)
                        layer = Map.setTile(layer, replaceCell, cell.tile)
                }

                layer = Map.setTile(layer, mouseCell, cell.tile)
            }
        }

        lastPlacedTile = state.mouse.tile

        editor.map = Map.setRoomLayer(
            editor.map,
            state.roomId,
            global.editors.mapEditing.layerDefId,
            layer)
    }
}