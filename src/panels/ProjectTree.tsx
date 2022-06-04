import * as React from "react"
import styled from "styled-components"
import { global } from "../global"
import * as Actions from "../actions"
import * as Editors from "../data/editors"


export function ProjectTree()
{
    const [currentDirectory, setCurrentDirectory] = React.useState(global.filesystem.root)


    return <StyledRoot>

        <StyledHeader>
            PROJECT

            <button
                onClick={ Actions.createDefFile.func }
            >
                + Defs
            </button>
        </StyledHeader>

        <StyledTree>

            { currentDirectory.childDirectories.map((directory, i) =>
                <StyledEntry
                    key={ i }
                >
                    📁 { directory.name }/
                </StyledEntry>
            )}

            { currentDirectory.childFiles.map((file, i) =>
                <StyledEntry
                    key={ i }
                    onDoubleClick={ () => Editors.openEditorDefs(file.rootRelativePath) }
                >
                    { file.name }
                </StyledEntry>
            )}

        </StyledTree>

    </StyledRoot>
}


const StyledRoot = styled.div`
    grid-column: 1;
    grid-row: 2;

    width: 15em;
    height: 100%;
    min-height: 0;

    display: grid;
    grid-template: auto 1fr / 1fr;

    background-color: #252525;

    user-select: none;
`


const StyledHeader = styled.div`
    padding: 0.5em 1em;
`


const StyledTree = styled.div`
    overflow-x: hidden;
    overflow-y: auto;
`


const StyledEntry = styled.div`
    padding: 0.25em 1em;
    
    cursor: pointer;

    &:hover
    {
        background-color: #333333;
    }
`