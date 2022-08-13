import * as React from "react"
import styled from "styled-components"
import { global } from "../global"
import * as Editors from "../data/editors"
import * as Filesystem from "../data/filesystem"
import * as Images from "../data/images"
import * as UI from "../ui"


export function ProjectTree()
{
    const [currentDirectory, setCurrentDirectory] =
        React.useState<string[]>([])

    let directoryEntry = Filesystem.findDirectory(
        Filesystem.PROJECT_ROOT_PATH + currentDirectory.join(Filesystem.DIRECTORY_SEPARATOR))

    if (!directoryEntry)
        directoryEntry = global.filesystem.root

    if (!global.filesystem.root.handle)
        return <div/>


    const enterDirectory = (name: string) =>
    {
        setCurrentDirectory(c => [...c, name])
    }


    const leaveDirectory = () =>
    {
        setCurrentDirectory(c => c.slice(0, c.length - 1))
    }


    return <StyledRoot>

        <StyledHeader>
            PROJECT

            { " " }

            <UI.Button
                onClick={ async () => {
                    await Filesystem.refreshEntries()
                    await Editors.refreshDefsForOpenEditors()
                    Images.invalidateImages()
                    global.editors.refreshToken.commit()
                }}
            >
                🔁 Refresh
            </UI.Button>

            <UI.HorizontalBar/>

            <UI.Button
                onClick={ () => Filesystem.showNewDefsFilePicker(directoryEntry?.handle) }
            >
                ➕&#xFE0E; Defs
            </UI.Button>

            <UI.Button
                onClick={ () => Filesystem.showNewMapFilePicker(directoryEntry?.handle) }
            >
                ➕&#xFE0E; Map
            </UI.Button>

            <UI.HorizontalBar/>
            
            <UI.Button
                label={
                    "◀ 📁 " +
                    currentDirectory.join(Filesystem.DIRECTORY_SEPARATOR) + "/"
                }
                title="Go to parent directory"
                onClick={ leaveDirectory }
                fullWidth
                textAlign="left"
            />

        </StyledHeader>

        <StyledTree>

            { directoryEntry.childDirectories.map((directory, i) =>
                <StyledEntry
                    key={ i }
                    onDoubleClick={ () => enterDirectory(directory.name) }
                    isRecognized
                >
                    📁 { directory.name }/
                </StyledEntry>
            )}

            { directoryEntry.childFiles.map((file, i) =>
                <StyledEntry
                    key={ i }
                    onDoubleClick={ () => Editors.openEditorByFile(file.rootRelativePath) }
                    isRecognized={ Filesystem.isRecognizedFile(file.rootRelativePath) }
                >
                    { Filesystem.getFileDisplayName(file.name) }
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


const StyledEntry = styled.button<{
    isRecognized: boolean,
}>`
    display: block;
    border: 0;
    outline: none;
    
    font-family: inherit;
    font-weight: inherit;
    font-size: 1em;

    width: 100%;
    padding: 0.25em 1em;
    
    cursor: pointer;

    color: inherit;
    background-color: transparent;
    opacity: ${ props => props.isRecognized ? "1" : "0.6" };
    text-align: left;

    &:hover
    {
        background-color: #2d2d2d;
    }

    &:focus
    {
        background-color: #373737;
        outline: solid #666666;
        outline-width: 1px;
        outline-offset: -1px;
    }
`