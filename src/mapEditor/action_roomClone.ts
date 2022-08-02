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

        const selectedRooms = [...state.roomSelection]
            .map(id => editor.map.rooms[id])
            .filter(o => o !== undefined)

        const result = Map.cloneRooms(
            editor.map,
            selectedRooms)
            
        state.roomSelection = new Set(result.newIds)

        if (result.newIds.length > 0)
            state.roomId = result.newIds[0]

        editor.map = result.map

        MapEditor.setupRoomMove(state)
    }
}