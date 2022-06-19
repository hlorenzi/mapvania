import * as React from "react"
import styled from "styled-components"
import { global } from "../global"
import * as Editors from "../data/editors"
import * as Dev from "../data/dev"


export function Tabs()
{
    const changeCurrentEditor = (i: number) =>
    {
        global.editors.currentEditor = i
        global.editors.refreshToken.commit()
        Dev.refreshDevFile()
    }


    return <StyledRoot>

        <StyledScroll>

            { global.editors.editors.map((editor, i) =>
                <StyledTab
                    key={ i }
                    selected={ global.editors.currentEditor === i }
                    onClick={ () => changeCurrentEditor(i) }
                >
                    { editor.name }
                    { Editors.isEditorUnsaved(editor) ? "*" : "" }

                    <StyledTabButton
                        onClick={ () => Editors.askAndCloseEditor(i) }
                    >
                        ×
                    </StyledTabButton>
                </StyledTab>
            )}

        </StyledScroll>

    </StyledRoot>
}


const StyledRoot = styled.div`
    width: 100%;
    min-width: 0;
    height: 2em;

    display: grid;
    grid-template: auto / auto;
    grid-auto-flow: column;
    align-items: center;

    background-color: #252525;

    user-select: none;
`


const StyledScroll = styled.div`
    height: 100%;

    overflow-x: auto;
    overflow-y: hidden;
`


const StyledTab = styled.div<{
    selected: boolean,
}>`
    display: inline-block;

    height: 100%;

    margin-right: 1px;
    padding: 0.25em 0 0.25em 1em;
    
    cursor: pointer;

    background-color: ${ props => props.selected ? "#1e1e1e" : "#2d2d2d" };
`


const StyledTabButton = styled.button`
    color: inherit;
    background-color: transparent;
    border: 0;
    border-radius: 0.25em;
    margin-left: 0.25em;
    margin-right: 0.25em;
    cursor: pointer;

    &:hover
    {
        background-color: #444444;
    }
`