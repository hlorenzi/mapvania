import * as Editor from "./index"
import * as Project  from "../../project"
import { global, deepAssignProject } from "../../global"


export function setupEraseTiles(state: Editor.State)
{
    state.rectSelection = null

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

        const cellIndex = Project.getTileFieldCellIndexForCell(layer.tileField, state.mouse.tile)
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