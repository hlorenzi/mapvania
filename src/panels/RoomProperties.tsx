import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import * as ID from "../data/id"
import * as Properties from "../data/properties"
import * as UI from "../ui"
import { global } from "../global"
import { PropertyValuesPanel } from "./PropertyValuesPanel"


export function RoomProperties(props: {
    editorIndex: number,
})
{
    const editor = global.editors.editors[props.editorIndex] as Editors.EditorMap

    if (global.editors.mapEditing.layerDefId !== Editors.LAYERDEF_ID_MAP)
        return null

    const roomSelection = [...editor.mapEditor.roomSelection]

    if (roomSelection.length === 0)
        return null


    const rooms = roomSelection
        .map(id => editor.map.rooms[id])
        .filter(room => !!room)

    if (rooms.length === 0)
        return null

    const propertiesDef = Defs.getRoomPropertyDefs(editor.defs)

    const properties = rooms.map(room => room.properties)

    const setProperties = (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) =>
    {
        let newMap: Map.Map = editor.map
        
        for (const roomId of roomSelection)
        {
            const room = newMap.rooms[roomId]
            const newRoom = {
                ...room,
                properties: modifyFn(room.properties),
            }

            newMap = Map.setRoom(newMap, roomId, newRoom)
        }

        editor.map = newMap
        global.editors.refreshToken.commit()
    }


    return <div style={{
        height: "100%",
        minHeight: "0",
        contain: "paint",
        pointerEvents: "auto",
        backgroundColor: "#242424",
    }}>
        <UI.HeaderAndBody
            header="ROOM PROPERTIES"
        >
            <div style={{
                width: "100%",
                height: "100%",
                minHeight: "0",

                gridTemplate: "auto 1fr / 1fr",
            }}>

                <UI.Grid template="auto 1fr" fullHeight style={{
                    padding: "1em",
                    overflowY: "auto",
                }}>
                    <UI.Cell span={ 2 } justifyStart>

                        { rooms.length == 1 ?
                            "ID: " + rooms[0].id :
                            rooms.length + " rooms selected"
                        }

                    </UI.Cell>

                    <UI.Cell span={ 2 } divider/>
                    
                    <UI.Cell span={ 2 } justifyStretch>
                        
                        <PropertyValuesPanel
                            key={ roomSelection.join(",") }
                            defProperties={ propertiesDef }
                            properties={ properties }
                            setProperties={ setProperties }
                        />

                    </UI.Cell>

                </UI.Grid>

            </div>
        
        </UI.HeaderAndBody>

    </div>
}