import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"


export function setupRoomClone(state: MapEditor.State)
{
    const editor = global.editors.editors[state.editorIndex] as Editors.EditorMap
    
    const roomsOrig = editor.map.rooms


    state.onMouseMove = () =>
    {
        if (state.mouseDownLockedGrid)
            return

        const originalSelection = [...state.roomSelection]
        state.roomSelection.clear()

        for (const roomId of originalSelection)
        {
            const originalRoom = roomsOrig[roomId]
            if (!originalRoom)
                continue

            const [newMap, clonedRoom] = Map.cloneRoom(
                editor.map,
                originalRoom)

            editor.map = newMap

            state.roomSelection.add(clonedRoom.id)
            state.roomId = clonedRoom.id
        }

        MapEditor.setupRoomMove(state)
    }
}