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
    const modify = (newDefs: DeepAssignable<Defs.Defs>) =>
    {
        Editors.deepAssignEditor(props.editorIndex, {
            defs: newDefs,
        })
    }

    return <UI.Grid template="10em auto">

        <UI.Cell justifyEnd>
            Room Grid Size
        </UI.Cell>

        <UI.Cell>
            <UI.Input
                number
                value={ defs.generalDefs.roomWidthMultiple }
                onChangeNumber={ (value) => modify({ generalDefs: { roomWidthMultiple: value } }) }
            />
            { " × " }
            <UI.Input
                value={ defs.generalDefs.roomHeightMultiple }
                onChangeNumber={ (value) => modify({ generalDefs: { roomHeightMultiple: value } }) }
            />
            { " px" }
        </UI.Cell>

        <UI.Cell justifyEnd>
            Room Default Size
        </UI.Cell>

        <UI.Cell>
            <UI.Input
                number
                value={ defs.generalDefs.roomDefaultWidthInTiles }
                onChangeNumber={ (value) => modify({ generalDefs: { roomDefaultWidthInTiles: value } }) }
            />
            { " × " }
            <UI.Input
                value={ defs.generalDefs.roomDefaultHeightInTiles }
                onChangeNumber={ (value) => modify({ generalDefs: { roomDefaultHeightInTiles: value } }) }
            />
            { " tiles" }
        </UI.Cell>

    </UI.Grid>
}