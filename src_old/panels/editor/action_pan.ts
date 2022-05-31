import * as Editor from "./index"
import * as Project  from "../../project"
import { global, deepAssignProject } from "../../global"


export function setupPan(state: Editor.State)
{
    const cameraPosOriginal = state.camera.pos


    state.onMouseMove = () =>
    {
        state.camera.pos =
        {
            x: cameraPosOriginal.x - state.mouseDownDelta.posRaw.x,
            y: cameraPosOriginal.y - state.mouseDownDelta.posRaw.y,
        }
        
        Editor.render(state)
    }
}