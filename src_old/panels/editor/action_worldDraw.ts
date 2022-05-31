import * as Editor from "./index"
import * as Project  from "../../project"
import { global, deepAssignProject } from "../../global"


export function setupWorldDraw(state: Editor.State)
{
    const stageRect =
    {
        tile1: state.mouse.tile,
        tile2: state.mouse.tile,
    }

    state.onMouseMove = () =>
    {
        stageRect.tile2 = state.mouse.tile
    }

    state.onRenderWorldTool = () =>
    {
        state.ctx.strokeStyle = "#4f0"

        const tx1 = Math.min(stageRect.tile1.x, stageRect.tile2.x)
        const tx2 = Math.max(stageRect.tile1.x, stageRect.tile2.x)
        const ty1 = Math.min(stageRect.tile1.y, stageRect.tile2.y)
        const ty2 = Math.max(stageRect.tile1.y, stageRect.tile2.y)

        state.ctx.strokeRect(
            tx1 * global.project.defs.stageWidthMultiple,
            ty1 * global.project.defs.stageHeightMultiple,
            (tx2 - tx1 + 1) * global.project.defs.stageWidthMultiple,
            (ty2 - ty1 + 1) * global.project.defs.stageHeightMultiple)
    }

    state.onMouseUp = () =>
    {
        const tx1 = Math.min(stageRect.tile1.x, stageRect.tile2.x)
        const tx2 = Math.max(stageRect.tile1.x, stageRect.tile2.x)
        const ty1 = Math.min(stageRect.tile1.y, stageRect.tile2.y)
        const ty2 = Math.max(stageRect.tile1.y, stageRect.tile2.y)

        const newStage: Project.Stage = {
            id: global.project.nextId,
            name: "stage_2",

            x: tx1 * global.project.defs.stageWidthMultiple,
            y: ty1 * global.project.defs.stageHeightMultiple,
            width: (tx2 - tx1 + 1) * global.project.defs.stageWidthMultiple,
            height: (ty2 - ty1 + 1) * global.project.defs.stageHeightMultiple,

            layers: [],
        }

        const world = Project.getWorld(global.project, state.worldId)
        if (!world)
            return
        
        global.project = Project.setWorld(global.project, state.worldId, {
            ...world,
            stages: [
                ...world.stages,
                newStage,
            ],
        })

        global.project = {
            ...global.project,
            nextId: global.project.nextId + 1,
        }

        global.projectToken.commit()
    }
}