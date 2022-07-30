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

    if (roomSelection.length == 0)
        return null


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

                        { roomSelection.length == 1 ?
                            "ID: " + roomSelection[0] :
                            roomSelection.length + " rooms selected"
                        }

                    </UI.Cell>

                </UI.Grid>

            </div>
        
        </UI.HeaderAndBody>

    </div>
}