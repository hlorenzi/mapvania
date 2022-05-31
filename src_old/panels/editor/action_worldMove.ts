import * as Editor from "./index"
import * as Project  from "../../project"
import { global, deepAssignProject } from "../../global"


export function setupWorldMove(state: Editor.State)
{
    const world = Project.getWorld(global.project, state.worldId)
    if (!world)
        return

    const stagesOrig = world.stages


    state.onMouseMove = () =>
    {
        const world = Project.getWorld(global.project, state.worldId)
        if (!world)
            return

        const newStages = [...world.stages]

        for (let i = 0; i < newStages.length; i++)
        {
            const stage = newStages[i]

            if (!state.stageSelection.has(stage.id))
                continue

            const stageOrig = stagesOrig.find(s => s.id === stage.id)
            if (!stageOrig)
                continue

            newStages[i] = {
                ...stage,
                
                x: snap(
                    stageOrig.x +
                        global.project.defs.stageWidthMultiple * state.mouseDownDelta.tile.x,
                    global.project.defs.stageWidthMultiple),

                y: snap(
                    stageOrig.y +
                        global.project.defs.stageHeightMultiple * state.mouseDownDelta.tile.y,
                        global.project.defs.stageHeightMultiple),
            }
        }

        global.project = Project.setWorld(
            global.project,
            state.worldId,
            {
                ...world,
                stages: newStages,
            })
    }

    state.onRenderWorldTool = () =>
    {
    }

    state.onMouseUp = () =>
    {
        global.projectToken.commit()
    }
}


function snap(x: number, step: number): number
{
    return Math.round(x / step) * step
}