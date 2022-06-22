import * as MapEditor from "./index"


export function setupPan(state: MapEditor.State)
{
    const originalPos = state.camera.pos


    state.onMouseMove = () =>
    {
        state.camera.pos =
        {
            x: originalPos.x - state.mouseDownDelta.posRaw.x,
            y: originalPos.y - state.mouseDownDelta.posRaw.y,
        }
    }
}