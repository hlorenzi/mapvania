import * as React from "react"
import * as ReactDOM from "react-dom"
import styled from "styled-components"
import { EditorEmpty } from "./EditorEmpty"


export function EditorRoot()
{
    return <StyledEditorRoot>

        <EditorEmpty/>

    </StyledEditorRoot>
}


const StyledEditorRoot = styled.div`
    grid-row: 2;
    grid-column: 2;

    width: 100%;
    height: 100%;

    display: grid;
    grid-template: 1fr / 1fr;
    align-items: center;
    justify-items: center;
`