import * as Solid from "solid-js"
import { styled } from "solid-styled-components"
import * as Filesystem from "../data/filesystem.ts"
import * as UI from "../ui/index.ts"
import * as Global from "../global.ts"


export function ProjectTree()
{
    const [filesystem] = Global.useFilesystem()

    const [currentDirectory, setCurrentDirectory] =
        Solid.createSignal<string[]>([])

    let directoryEntry = Solid.createMemo(() =>
        Filesystem.findDirectory(
            filesystem(),
            Filesystem.PROJECT_ROOT_PATH +
                currentDirectory().join(Filesystem.DIRECTORY_SEPARATOR))
    )

    //if (!directoryEntry)
    //    directoryEntry = global.filesystem.root

    const rootHandle = Solid.createMemo(() => filesystem().root.handle)
    if (!rootHandle)
        return <div/>


    const enterDirectory = (name: string) =>
    {
        setCurrentDirectory(c => [...c, name])
    }


    const leaveDirectory = () =>
    {
        setCurrentDirectory(c => c.slice(0, c.length - 1))
    }


    return <Solid.Show when={ !!filesystem().root.handle }>
        <StyledRoot>

            <StyledHeader>
                PROJECT

                { " " }

                <UI.Button
                    onClick={ async () => {
                        //await Filesystem.refreshEntries()
                        //await Editors.refreshDefsForOpenEditors()
                        //Images.invalidateImages()
                        //global.editors.refreshToken.commit()
                    }}
                >
                    🔁 Refresh
                </UI.Button>

                <UI.HorizontalBar/>

                <UI.Button
                    onClick={ () => Filesystem.showNewDefsFilePicker(directoryEntry()?.handle) }
                >
                    ➕&#xFE0E; Defs
                </UI.Button>

                <UI.Button
                    onClick={ () => Filesystem.showNewMapFilePicker(directoryEntry()?.handle) }
                >
                    ➕&#xFE0E; Map
                </UI.Button>

                <UI.HorizontalBar/>
                
                <UI.Button
                    label={
                        "◀ 📁 " +
                        currentDirectory().join(Filesystem.DIRECTORY_SEPARATOR) + "/"
                    }
                    title="Go to parent directory"
                    onClick={ leaveDirectory }
                    fullWidth
                    textAlign="left"
                />

            </StyledHeader>

            <StyledTree>

                <Solid.For each={ directoryEntry()?.childDirectories }>
                    { (directory) =>
                        <StyledEntry
                            onDblClick={ () => enterDirectory(directory.name) }
                            isRecognized
                        >
                            📁 { directory.name }/
                        </StyledEntry>
                    }
                </Solid.For>

                <Solid.For each={ directoryEntry()?.childFiles }>
                    { (file) =>
                        <StyledEntry
                            //onDblClick={ () => Editors.openEditorByFile(file.rootRelativePath) }
                            isRecognized={ Filesystem.isRecognizedFile(file.rootRelativePath) }
                        >
                            { Filesystem.getFileDisplayName(file.name) }
                        </StyledEntry>
                    }
                </Solid.For>

            </StyledTree>

        </StyledRoot>
    </Solid.Show>
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