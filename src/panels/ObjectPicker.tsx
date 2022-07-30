import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as ID from "../data/id"
import * as Images from "../data/images"
import * as UI from "../ui"
import { global } from "../global"
import { useCachedState } from "../util/useCachedState"


export function ObjectPicker(props: {
    editorIndex: number,
})
{
    const editor = global.editors.editors[props.editorIndex] as Editors.EditorMap
    const [state, setState] = useCachedState("ObjectPickerListState", UI.makeHierarchicalListState())


    const chooseObject = (id: ID.ID) =>
    {
        global.editors.mapEditing.objectDefId = id
        global.editors.mapEditing.tool = "draw"
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
            header="OBJECT SELECTOR"
        >

            <UI.Grid template="1fr" templateRows="1fr">

                <UI.HierarchicalList<Defs.DefObject>
                    is2D
                    items={ editor.defs.objectDefs }
                    value={ global.editors.mapEditing.objectDefId }
                    onChange={ chooseObject }
                    state={ state }
                    setState={ setState }
                    getItemIcon={ item => Defs.getObjectDefIconElement(item) }
                    getItemLabel={ item => item.name }
                />

            </UI.Grid>

        </UI.HeaderAndBody>

    </div>
}