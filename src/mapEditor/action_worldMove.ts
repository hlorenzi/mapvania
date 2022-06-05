import * as MapEditor from "./index"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import { global } from "../global"


export function setupWorldMove(state: MapEditor.State)
{
    const editor = (global.editors.editors[state.editorIndex] as Editors.EditorMap)
    const defs = editor.defs
    const map = editor.map

    
    const roomsOrig = map.rooms


    state.onMouseMove = () =>
    {
        const newRooms = {...map.rooms}

        for (const room of Object.values(newRooms))
        {
            if (!state.stageSelection.has(room.id))
                continue

            const roomOrig = roomsOrig[room.id]

            newRooms[room.id] = {
                ...room,
                
                x: snap(
                    roomOrig.x +
                        defs.generalDefs.roomWidthMultiple * state.mouseDownDelta.tile.x,
                    defs.generalDefs.roomWidthMultiple),

                y: snap(
                    roomOrig.y +
                        defs.generalDefs.roomHeightMultiple * state.mouseDownDelta.tile.y,
                        defs.generalDefs.roomHeightMultiple),
            }
        }

        editor.map = {
            ...editor.map,
            rooms: newRooms,
        }
    }

    state.onRenderWorldTool = () =>
    {
    }

    state.onMouseUp = () =>
    {
        global.editors.refreshToken.commit()
    }
}


function snap(x: number, step: number): number
{
    return Math.round(x / step) * step
}