import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as ID from "../data/id"
import * as UI from "../ui"
import { global } from "../global"


export function LayerPicker(props: {
    editorIndex: number,
})
{
    const editor = global.editors.editors[props.editorIndex] as Editors.EditorMap


    const chooseLayer = (id: ID.ID) =>
    {
        Editors.setCurrentLayer(props.editorIndex, id)
    }


    const getLayerIcon = (layerDef: Defs.DefLayer) =>
    {
        return layerDef.type == "tile" ? "🧱" :
            layerDef.type == "object" ? "🍎" :
            ""
    }


    const layerItems = [
        {
            id: Editors.LAYERDEF_ID_MAP,
            label: "🗺️ Map",
        },
        ...editor.defs.layerDefs.map(layerDef => ({
            id: layerDef.id,
            label: getLayerIcon(layerDef) + " " + layerDef.name,
        }))
    ]


    return <div style={{
        maxHeight: "40vh",
        contain: "paint",
        pointerEvents: "auto",
        backgroundColor: "#242424",
    }}>
        <UI.HeaderAndBody>

            <UI.Grid template="1fr" templateRows="1fr">

                <UI.List
                    value={ global.editors.mapEditing.layerDefId }
                    onChange={ chooseLayer }
                    items={ layerItems }
                />

            </UI.Grid>

        </UI.HeaderAndBody>

    </div>
}