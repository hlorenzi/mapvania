import * as Editor from "./index"
import * as Project  from "../../project"
import { global, deepAssignProject } from "../../global"


export function setupDrawTiles(state: Editor.State)
{
    let lastPlacedTile = { x: -100000, y: -100000 }

    state.selection = null

    state.onMouseMove = () =>
    {
        global.project = Project.ensureStageLayer(
            global.project,
            state.worldId,
            state.stageId,
            global.editingLayerId)

        let layer = Project.getStageLayer(
            global.project,
            state.worldId,
            state.stageId,
            global.editingLayerId)

        if (!layer || layer.type !== "tile")
            return

        if (Math.abs(state.mouse.tile.x - lastPlacedTile.x) < global.editingTileStamp.width &&
            Math.abs(state.mouse.tile.y - lastPlacedTile.y) < global.editingTileStamp.height)
            return

        for (const cell of Project.enumerateTileFieldCellsCentered(global.editingTileStamp))
        {
            const mouseCell = {
                x: state.mouse.tile.x + cell.x,
                y: state.mouse.tile.y + cell.y,
            }

            const cellIndex = Project.getTileFieldCellIndexForCell(layer.tileField, mouseCell)
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
        
        global.project = Project.setStageLayer(
            global.project,
            state.worldId,
            state.stageId,
            global.editingLayerId,
            layer)
    }

    state.onMouseUp = () =>
    {
        global.projectToken.commit()
    }
}