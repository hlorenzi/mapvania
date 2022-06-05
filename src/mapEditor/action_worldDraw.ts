import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"


export function setupWorldDraw(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const defs = editor.defs
    const map = editor.map


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
            tx1 * defs.generalDefs.roomWidthMultiple,
            ty1 * defs.generalDefs.roomHeightMultiple,
            (tx2 - tx1 + 1) * defs.generalDefs.roomWidthMultiple,
            (ty2 - ty1 + 1) * defs.generalDefs.roomHeightMultiple)
    }

    state.onMouseUp = () =>
    {
        const tx1 = Math.min(stageRect.tile1.x, stageRect.tile2.x)
        const tx2 = Math.max(stageRect.tile1.x, stageRect.tile2.x)
        const ty1 = Math.min(stageRect.tile1.y, stageRect.tile2.y)
        const ty2 = Math.max(stageRect.tile1.y, stageRect.tile2.y)

        const [nextIDs, newRoomId] = ID.getNextID(map.nextIDs)

        const newRoom: Map.Room = {
            id: newRoomId,

            x: tx1 * defs.generalDefs.roomWidthMultiple,
            y: ty1 * defs.generalDefs.roomHeightMultiple,
            width: (tx2 - tx1 + 1) * defs.generalDefs.roomWidthMultiple,
            height: (ty2 - ty1 + 1) * defs.generalDefs.roomHeightMultiple,

            layers: {},
        }

        editor.map = Map.setRoom(map, newRoomId, newRoom)
        editor.map = {
            ...editor.map,
            nextIDs: nextIDs,
        }

        global.editors.refreshToken.commit()
    }
}