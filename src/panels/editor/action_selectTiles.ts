import * as Editor from "./index"
import * as Project  from "../../project"
import { global, deepAssignProject } from "../../global"


export function setupSelectTiles(state: Editor.State)
{
    state.selection =
    {
        tile1: state.mouse.tile,
        tile2: state.mouse.tile,
    }

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

        state.selection!.tile2 = state.mouse.tile
    }
}