import * as React from "react"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as UI from "../ui"
import { global } from "../global"
import styled from "styled-components"
import { DeepAssignable } from "../util/deepAssign"


export function DefsGeneral(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs


    const setDefs = (fn: (old: Defs.Defs) => Defs.Defs) =>
    {
        Editors.assignEditorDefs(props.editorIndex, fn)
    }


    const set = (fn: (old: Defs.DefGeneral) => Defs.DefGeneral) =>
    {
        setDefs(defs => ({
            ...defs,
            generalDefs: fn(defs.generalDefs),
        }))
    }


    return <UI.Grid template="10em auto">

        <UI.Cell justifyEnd>
            Room Grid
        </UI.Cell>

        <UI.Cell>
            <UI.Input
                number
                valueSignal={ defs.generalDefs.roomWidthMultiple }
                onChangeNumber={ (value) => set(d => ({ ...d, roomWidthMultiple: value })) }
            />
            { " × " }
            <UI.Input
                number
                valueSignal={ defs.generalDefs.roomHeightMultiple }
                onChangeNumber={ (value) => set(d => ({ ...d, roomHeightMultiple: value })) }
            />
            { " px" }
        </UI.Cell>

        
        <UI.Cell justifyEnd>
            Display Room Grid
        </UI.Cell>

        <UI.Cell>
            <UI.Input
                number
                disabled={ !defs.generalDefs.displayGrid.enabled }
                valueSignal={ defs.generalDefs.displayGrid.width }
                onChangeNumber={ (value) => set(d => ({ ...d, displayGrid: { ...defs.generalDefs.displayGrid, width: value } })) }
            />
            { " × " }
            <UI.Input
                number
                disabled={ !defs.generalDefs.displayGrid.enabled }
                valueSignal={ defs.generalDefs.displayGrid.height }
                onChangeNumber={ (value) => set(d => ({ ...d, displayGrid: { ...defs.generalDefs.displayGrid, height: value } })) }
            />
            { " px " }
            <UI.Checkbox
                label="Enable"
                value={ defs.generalDefs.displayGrid.enabled }
                onChange={ (value) => set(d => ({ ...d, displayGrid: { ...defs.generalDefs.displayGrid, enabled: value } })) }
                style={{ marginLeft: "0.5em" }}
            />
        </UI.Cell>


        <UI.Cell span={ 2 } divider/>

        
        <UI.Cell justifyEnd>
            JSON Export Type
        </UI.Cell>

        <UI.Cell>
            <UI.Select
                value={ defs.generalDefs.jsonExportType }
                onChange={ (value) => set(d => ({ ...d, jsonExportType: value as Defs.DefGeneral["jsonExportType"] })) }
            >
                <option value="standard">Standard</option>
                <option value="merge-friendly">Git merge-friendly</option>
            </UI.Select>
        </UI.Cell>

        
        <UI.Cell justifyEnd>
            Minimize
        </UI.Cell>

        <UI.Cell>
            <UI.Checkbox
                value={ defs.generalDefs.jsonMinimize }
                onChange={ (value) => set(d => ({ ...d, jsonMinimize: value })) }
            />
        </UI.Cell>

        
        <UI.Cell justifyEnd>
            Use Trailing Commas
        </UI.Cell>

        <UI.Cell>
            <UI.Checkbox
                value={ defs.generalDefs.jsonUseTrailingCommas }
                onChange={ (value) => set(d => ({ ...d, jsonUseTrailingCommas: value })) }
            />
        </UI.Cell>

        
        <UI.Cell justifyEnd>
            Use Bare Identifiers
        </UI.Cell>

        <UI.Cell>
            <UI.Checkbox
                value={ defs.generalDefs.jsonUseBareIdentifiers }
                onChange={ (value) => set(d => ({ ...d, jsonUseBareIdentifiers: value })) }
            />
        </UI.Cell>

    </UI.Grid>
}