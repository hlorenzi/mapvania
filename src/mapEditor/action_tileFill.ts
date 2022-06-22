import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import * as MathUtils from "../util/mathUtils"
import { global } from "../global"


export function setupTileFill(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const tileStamp = global.editors.mapEditing.tileStamp

    
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

        const originalCell = state.mouse.tile
        
        const originalCellIndex = Map.getTileFieldCellIndexForCell(
            layer.tileField,
            originalCell)

        if (originalCellIndex === undefined)
            return

        const originalTile = layer.tileField.tiles[originalCellIndex]

        const cellsToFill: MathUtils.Point[] = []
        const cellsToSearch: MathUtils.Point[] = [state.mouse.tile]
        const searchedCells = new Set<string>()

        while (cellsToSearch.length > 0)
        {
            const cell = cellsToSearch.pop()!
            const cellKey = cell.x + "," + cell.y

            if (searchedCells.has(cellKey))
                continue

            searchedCells.add(cellKey)

            const cellIndex = Map.getTileFieldCellIndexForCell(
                layer.tileField,
                cell)

            if (cellIndex === undefined)
                continue

            const tile = layer.tileField.tiles[cellIndex]
            
            if (tile?.tilesetDefId !== originalTile?.tilesetDefId ||
                tile?.tileId !== originalTile?.tileId)
                continue

            cellsToFill.push(cell)
            cellsToSearch.push({ x: cell.x - 1, y: cell.y })
            cellsToSearch.push({ x: cell.x + 1, y: cell.y })
            cellsToSearch.push({ x: cell.x, y: cell.y - 1 })
            cellsToSearch.push({ x: cell.x, y: cell.y + 1 })
        }

        const stampCenter = Map.getTileFieldCenter(tileStamp)

        for (const cell of cellsToFill)
        {
            const cellIndex = Map.getTileFieldCellIndexForCell(layer.tileField, cell)
            if (cellIndex === undefined)
                continue

            const newTileX = MathUtils.mod(cell.x + stampCenter.x - originalCell.x, tileStamp.width)
            const newTileY = MathUtils.mod(cell.y + stampCenter.y - originalCell.y, tileStamp.height)

            const newTileIndex = Map.getTileFieldCellIndexForCell(
                tileStamp,
                { x: newTileX, y: newTileY })!

            const newTile = tileStamp.tiles[newTileIndex]

            layer = {
                ...layer,
                tileField: {
                    ...layer.tileField,
                    tiles: [
                        ...layer.tileField.tiles.slice(0, cellIndex),
                        newTile,
                        ...layer.tileField.tiles.slice(cellIndex + 1),
                    ]
                }
            }
        }

        editor.map = Map.setRoomLayer(
            editor.map,
            state.roomId,
            global.editors.mapEditing.layerDefId,
            layer)
    }
}