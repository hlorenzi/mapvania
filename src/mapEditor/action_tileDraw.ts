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


        const setTile = (l: Map.LayerTile, cell: { x: number, y: number }, tile: Map.Tile | undefined) =>
        {
            const cellIndex = Map.getTileFieldCellIndexForCell(l.tileField, cell)
            if (cellIndex === undefined)
                return l

            return {
                ...l,
                tileField: {
                    ...l.tileField,
                    tiles: [
                        ...l.tileField.tiles.slice(0, cellIndex),
                        tile,
                        ...l.tileField.tiles.slice(cellIndex + 1),
                    ]
                }
            }
        }


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

                layer = setTile(layer, mouseCell, cell.tile)
            }

            lastPlacedTile = state.mouse.tile
        }

        else
        {
            const defaultTileIndex = Defs.getTileBrushDefaultTile(editor.defs, brush)
            if (defaultTileIndex === undefined)
                return

            const defaultTile: Map.Tile = {
                tilesetDefId: brush.tilesetDefId,
                tileId: defaultTileIndex,
            }
            
            layer = setTile(layer, state.mouse.tile, defaultTile)

            for (let cx = -1; cx <= 1; cx++)
            for (let cy = -1; cy <= 1; cy++)
            {
                const cell = {
                    x: state.mouse.tile.x + cx,
                    y: state.mouse.tile.y + cy,
                }

                const neighborTileIndex = Map.getTileFieldCellIndexForCell(
                    layer.tileField,
                    cell)

                if (neighborTileIndex === undefined)
                    continue

                const neighborTile = layer.tileField.tiles[neighborTileIndex]
                if (neighborTile === undefined ||
                    neighborTile.tilesetDefId !== defaultTile.tilesetDefId)
                    continue

                if (!Defs.isTileInTileBrush(editor.defs, brush, neighborTile.tileId))
                    continue

                const modifiedTileIndex = Map.getBrushTileDecisionAt(
                    editor.defs,
                    brush,
                    layer.tileField,
                    cell)

                if (modifiedTileIndex === undefined)
                    continue

                const modifiedTile: Map.Tile = {
                    tilesetDefId: brush.tilesetDefId,
                    tileId: modifiedTileIndex,
                }
                
                layer = setTile(layer, cell, modifiedTile)
            }
        }
        
        editor.map = Map.setRoomLayer(
            editor.map,
            state.roomId,
            global.editors.mapEditing.layerDefId,
            layer)
    }
}