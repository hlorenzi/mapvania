import * as React from "react"
import * as ReactDOM from "react-dom"
import styled from "styled-components"
import { global } from "../global"
import { openFolder } from "../actions/openFolder"


export function ProjectTree()
{
    const [currentDirectory, setCurrentDirectory] = React.useState(global.filesystem.root)


    return <StyledRoot>

        <StyledHeader>
            PROJECT
        </StyledHeader>

        <StyledTree>

            { currentDirectory.childDirectories.map((directory, i) =>
                <StyledEntry key={ i }>
                    📁 { directory.name }/
                </StyledEntry>
            )}

            { currentDirectory.childFiles.map((file, i) =>
                <StyledEntry key={ i }>
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

    font-size: 0.8em;
`


const StyledTree = styled.div`
    overflow-x: hidden;
    overflow-y: auto;
`


const StyledEntry = styled.div`
    padding: 0.25em 1em;
    
    font-size: 0.8em;
    cursor: pointer;

    &:hover
    {
        background-color: #333333;
    }
`