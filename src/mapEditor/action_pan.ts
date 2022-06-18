import * as MapEditor from "./index"


export function setupPan(state: MapEditor.State)
{
    const cameraPosOriginal = state.camera.pos


    state.onMouseMove = () =>
    {
        state.camera.pos =
        {
            x: cameraPosOriginal.x - state.mouseDownDelta.posRaw.x,
            y: cameraPosOriginal.y - state.mouseDownDelta.posRaw.y,
        }
    }
}