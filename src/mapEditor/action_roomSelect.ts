import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupRoomSelect(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    
    const rect = {
        x1: state.mouse.pos.x,
        y1: state.mouse.pos.y,
        x2: state.mouse.pos.x,
        y2: state.mouse.pos.y,
    }

    state.onMouseMove = () =>
    {
        rect.x2 = state.mouse.pos.x
        rect.y2 = state.mouse.pos.y

        const tx1 = Math.min(rect.x1, rect.x2)
        const tx2 = Math.max(rect.x1, rect.x2)
        const ty1 = Math.min(rect.y1, rect.y2)
        const ty2 = Math.max(rect.y1, rect.y2)

        const rectWH = {
            x: tx1,
            y: ty1,
            width: tx2 - tx1,
            height: ty2 - ty1,
        }

        state.roomSelection.clear()
        for (const room of Object.values(editor.map.rooms))
        {
            if (MathUtils.rectOverlaps(rectWH, room))
                state.roomSelection.add(room.id)
        }
    }

    state.onRenderMapTool = () =>
    {
        const tx1 = Math.min(rect.x1, rect.x2)
        const tx2 = Math.max(rect.x1, rect.x2)
        const ty1 = Math.min(rect.y1, rect.y2)
        const ty2 = Math.max(rect.y1, rect.y2)

        state.ctx.strokeStyle = "#0cf"
        state.ctx.strokeRect(
            tx1,
            ty1,
            tx2 - tx1,
            ty2 - ty1)
    }

    state.onMouseUp = () =>
    {
        global.editors.refreshToken.commit()
    }
}