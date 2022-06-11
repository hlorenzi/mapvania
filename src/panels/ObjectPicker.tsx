import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as ID from "../data/id"
import * as UI from "../ui"
import { global } from "../global"


export function ObjectPicker(props: {
    editorIndex: number,
})
{
    const editor = global.editors.editors[props.editorIndex] as Editors.EditorMap


    const chooseObject = (id: ID.ID) =>
    {
        global.editors.mapEditing.selectedObjectDefId = id
        global.editors.mapEditing.tileTool = "draw"
        global.editors.refreshToken.commit()
    }


    const items = [
        ...editor.defs.objectDefs.map(objectDef => ({
            id: objectDef.id,
            label: objectDef.name,
        }))
    ]


    return <div style={{
        height: "min-content",
        borderRadius: "0.5em",
        contain: "paint",
        pointerEvents: "auto",
        backgroundColor: "#242424",
    }}>
        <UI.HeaderAndBody
            header="OBJECTS"
        >

            <UI.Grid template="1fr" templateRows="1fr">

                <UI.List
                    value={ global.editors.mapEditing.selectedObjectDefId }
                    onChange={ chooseObject }
                    items={ items }
                />

            </UI.Grid>

        </UI.HeaderAndBody>

    </div>
}