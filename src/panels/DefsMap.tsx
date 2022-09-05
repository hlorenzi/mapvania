import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Filesystem from "../data/filesystem"
import * as Editors from "../data/editors"
import * as Images from "../data/images"
import * as Hierarchy from "../data/hierarchy"
import * as UI from "../ui"
import { global } from "../global"
import { PropertyDefsPanel } from "./PropertyDefsPanel"
import styled from "styled-components"


export function DefsMap(props: {
    editorIndex: number,
})
{
    const editor = global.editors.editors[props.editorIndex]
    const defs = editor.defs


    const setDefs = (fn: (old: Defs.Defs) => Defs.Defs) =>
    {
        Editors.assignEditorDefs(props.editorIndex, fn)
    }


    const set = (mapDef: Defs.DefMap) =>
    {
        setDefs(defs => ({
            ...defs,
            mapDef,
        }))
    }


    return <UI.Grid template="30em 1fr" templateRows="1fr" fullHeight alignStart>

        <div style={{
            width: "100%",
            height: "100%",
            overflowY: "scroll",
            paddingRight: "0.25em",
            marginBottom: "10em",
        }}>
            
            <UI.Grid template="auto auto">

                <UI.Cell span={ 2 } justifyStretch>
                    <PropertyDefsPanel
                        defProperties={ defs.mapDef.properties }
                        setDefProperties={ (value) => set({ ...defs.mapDef, properties: value }) }
                    />
                </UI.Cell>

            </UI.Grid>

        </div>
        
    </UI.Grid>
}