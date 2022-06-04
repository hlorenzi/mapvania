import * as React from "react"
import styled from "styled-components"
import { global } from "../global"
import { Tabs } from "./Tabs"
import { EditorEmpty } from "./EditorEmpty"
import { EditorDefs } from "./EditorDefs"


export function EditorRoot()
{
    const currentEditor =
        global.editors.currentEditor < 0 ? undefined :
        global.editors.editors[global.editors.currentEditor]

    return <StyledEditorRoot>

        <Tabs/>

        { !currentEditor && <EditorEmpty/> }

        { currentEditor?.type === "defs" &&
            <EditorDefs
                key={ global.editors.currentEditor }
                editorIndex={ global.editors.currentEditor }
            />
        }

    </StyledEditorRoot>
}


const StyledEditorRoot = styled.div`
    grid-row: 2;
    grid-column: 2;

    width: 100%;
    height: 100%;
    max-height: 100%;
    min-height: 0;

    display: grid;
    grid-template: auto 1fr / 1fr;
    align-items: center;
    justify-items: center;
`