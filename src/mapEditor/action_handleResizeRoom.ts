import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupHandleResizeRoom(state: MapEditor.State, directionX: number, directionY: number)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const defs = editor.defs
    const room = editor.map.rooms[state.roomId]


    const borderDisplacements =
    {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    }


    state.onMouseMove = () =>
    {
        const widthMinusOneTile = room.width - defs.generalDefs.roomWidthMultiple
        const heightMinusOneTile = room.height - defs.generalDefs.roomHeightMultiple

        const snappedDeltaX = MathUtils.snapRound(state.mouseDownDelta.pos.x, defs.generalDefs.roomWidthMultiple)
        const snappedDeltaY = MathUtils.snapRound(state.mouseDownDelta.pos.y, defs.generalDefs.roomHeightMultiple)

        if (directionX < 0)
            borderDisplacements.left = Math.min(snappedDeltaX, widthMinusOneTile)
                
        if (directionX > 0)
            borderDisplacements.right = Math.max(snappedDeltaX, -widthMinusOneTile)
                
        if (directionY < 0)
            borderDisplacements.top = Math.min(snappedDeltaY, heightMinusOneTile)
                
        if (directionY > 0)
            borderDisplacements.bottom = Math.max(snappedDeltaY, -heightMinusOneTile)
    }

    state.onRenderRoomTool = () =>
    {
        state.ctx.strokeStyle = "#0c0"

        const newRoomX1 = borderDisplacements.left
        const newRoomY1 = borderDisplacements.top
        const newRoomX2 = room.width + borderDisplacements.right
        const newRoomY2 = room.height + borderDisplacements.bottom

        state.ctx.strokeRect(
            newRoomX1,
            newRoomY1,
            newRoomX2 - newRoomX1,
            newRoomY2 - newRoomY1)

        const newRoomXTiles = Math.floor((newRoomX1 + room.x) / defs.generalDefs.roomWidthMultiple)
        const newRoomYTiles = Math.floor((newRoomY1 + room.y) / defs.generalDefs.roomHeightMultiple)
        const newRoomW = newRoomX2 - newRoomX1
        const newRoomH = newRoomY2 - newRoomY1
        const newRoomWTiles = Math.floor(newRoomW / defs.generalDefs.roomWidthMultiple)
        const newRoomHTiles = Math.floor(newRoomH / defs.generalDefs.roomHeightMultiple)

        MapEditor.drawInfoBox(
            state,
            `pos: (${ newRoomX1 + room.x }, ${ newRoomY1 + room.y }) px\n` +
            `size: (${ newRoomW }, ${ newRoomH }) px\n` +
            `\n` +
            `pos: (${ newRoomXTiles }, ${ newRoomYTiles }) tiles\n` +
            `size: (${ newRoomWTiles }, ${ newRoomHTiles }) tiles`)
    }

    state.onMouseUp = () =>
    {
        editor.map = Map.resizeRoom(
            editor.defs,
            editor.map,
            state.roomId,
            borderDisplacements.left,
            borderDisplacements.top,
            room.width - borderDisplacements.left + borderDisplacements.right,
            room.height - borderDisplacements.top + borderDisplacements.bottom)

        global.editors.refreshToken.commit()
    }
}