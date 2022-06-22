import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupRoomMove(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const defs = editor.defs

    
    const originalMap = editor.map
    const originalRooms = editor.map.rooms


    state.onMouseMove = () =>
    {
        let hadChanges = false

        const newRooms = { ...editor.map.rooms }

        for (const room of Object.values(newRooms))
        {
            if (!state.roomSelection.has(room.id))
                continue

            const originalRoom = originalRooms[room.id]

            const newX = MathUtils.snapRound(
                originalRoom.x +
                    defs.generalDefs.roomWidthMultiple * state.mouseDownDelta.tile.x,
                defs.generalDefs.roomWidthMultiple)

            const newY = MathUtils.snapRound(
                originalRoom.y +
                    defs.generalDefs.roomHeightMultiple * state.mouseDownDelta.tile.y,
                    defs.generalDefs.roomHeightMultiple)

            if (originalRoom.x == newX && originalRoom.y == newY)
                continue

            hadChanges = true

            newRooms[room.id] = {
                ...room,
                x: newX,
                y: newY,
            }
        }

        if (!hadChanges)
        {
            editor.map = originalMap
            return
        }

        editor.map = {
            ...editor.map,
            rooms: newRooms,
        }
    }
}