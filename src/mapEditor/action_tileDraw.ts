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

                layer = Map.setTile(layer, mouseCell, cell.tile)
            }
        }

        else
        {
            let drawnMultiplePrev = drawnMultiple

            drawnMultiple = drawnMultiple ||
                state.mouseDownDelta.tile.x !== 0 ||
                state.mouseDownDelta.tile.y !== 0

            const fillType = drawnMultiple ?
                Defs.BrushTileType.Full :
                Map.getBrushTileTypeForMousePosition(
                    editor.defs,
                    brush,
                    layerDef,
                    state.mouse.posInRoom)

            const defaultTileIndex = Defs.getTileWithCenterTypeInTileBrush(
                editor.defs,
                brush,
                fillType)
            
            if (defaultTileIndex === undefined)
                return

            const defaultTile: Map.Tile = {
                tilesetDefId: brush.tilesetDefId,
                tileId: defaultTileIndex,
            }
            
            layer = Map.setTile(layer, state.mouse.tile, defaultTile)
            layer = Map.fixBrushTileRegion(
                editor.defs,
                brush,
                layer,
                state.mouse.tile)

            if (drawnMultiple && !drawnMultiplePrev)
            {
                // Fix first placed tile to become
                // a Full tile.
                layer = Map.setTile(layer, lastPlacedTile, defaultTile)
                layer = Map.fixBrushTileRegion(
                    editor.defs,
                    brush,
                    layer,
                    lastPlacedTile)
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