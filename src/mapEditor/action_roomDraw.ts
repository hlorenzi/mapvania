import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"


export function setupRoomDraw(state: MapEditor.State)
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

    state.onRenderMapTool = () =>
    {
        state.ctx.strokeStyle = "#4f0"

        const tx1 = Math.min(stageRect.tile1.x, stageRect.tile2.x)
        const tx2 = Math.max(stageRect.tile1.x, stageRect.tile2.x)
        const ty1 = Math.min(stageRect.tile1.y, stageRect.tile2.y)
        const ty2 = Math.max(stageRect.tile1.y, stageRect.tile2.y)

        const newRoomXTiles = tx1
        const newRoomYTiles = ty1
        const newRoomWTiles = tx2 - tx1 + 1
        const newRoomHTiles = ty2 - ty1 + 1
        const newRoomX = tx1 * defs.generalDefs.roomHeightMultiple
        const newRoomY = ty1 * defs.generalDefs.roomHeightMultiple
        const newRoomW = newRoomWTiles * defs.generalDefs.roomWidthMultiple
        const newRoomH = newRoomHTiles * defs.generalDefs.roomHeightMultiple

        state.ctx.strokeRect(
            newRoomX, newRoomY,
            newRoomW, newRoomH)
            
        MapEditor.drawInfoBox(
            state,
            `pos: (${ newRoomX }, ${ newRoomY }) px\n` +
            `size: (${ newRoomW }, ${ newRoomH }) px\n` +
            `\n` +
            `pos: (${ newRoomXTiles }, ${ newRoomYTiles }) tiles\n` +
            `size: (${ newRoomWTiles }, ${ newRoomHTiles }) tiles`)
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

        editor.mapEditor.roomSelection.clear()
        editor.mapEditor.roomSelection.add(newRoomId)
        editor.mapEditor.roomId = newRoomId

        editor.map = Map.setRoom(map, newRoomId, newRoom)
        editor.map = {
            ...editor.map,
            nextIDs: nextIDs,
        }
    }
}