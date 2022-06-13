import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupObjectSelect(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    
    const layer = Map.getRoomLayer(
        editor.map,
        state.roomId,
        global.editors.mapEditing.layerDefId)

    if (!layer || layer.type !== "object")
        return

    const rect = {
        x1: state.mouse.posInRoom.x,
        y1: state.mouse.posInRoom.y,
        x2: state.mouse.posInRoom.x,
        y2: state.mouse.posInRoom.y,
    }

    state.onMouseMove = () =>
    {
        rect.x2 = state.mouse.posInRoom.x
        rect.y2 = state.mouse.posInRoom.y

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

        state.objectSelection.clear()
        for (const object of Object.values(layer.objects))
        {
            if (MathUtils.rectOverlaps(rectWH, MapEditor.getObjectRect(state, object)))
                state.objectSelection.add(object.id)
        }
    }

    state.onRenderRoomTool = () =>
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