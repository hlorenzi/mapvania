import * as React from "react"
import styled from "styled-components"
import { global } from "../global"
import * as Actions from "../actions"
import * as Filesystem from "../data/filesystem"
import * as ID from "../data/id"
import * as UI from "../ui"


export function EditorEmpty()
{
    const [refresh, setRefresh] = React.useState(0)
    const [hasCachedFolder, setHasCachedFolder] = React.useState(false)


    React.useEffect(() =>
    {
        window.requestAnimationFrame(async () =>
        {
            if (await Filesystem.retrieveCachedRootFolder())
                setHasCachedFolder(true)
        })

    }, [])


    return <StyledEditorEmpty>

        { !global.filesystem.root.handle &&
            <>
            To start, open a project folder.

            <br/>
            <br/>

            <UI.Button
                onClick={ Actions.openFolder.func }
            >
                📁 Choose folder...
            </UI.Button>

            { hasCachedFolder &&
                <>
                <br/>
                <br/>
                <UI.Button
                    onClick={ Filesystem.setRootDirectoryFromCache }
                >
                    🔁 Reopen previous project folder
                </UI.Button>
                </>
            }
            
            <br/>
            <br/>
            <UI.HorizontalBar/>
            <br/>

            Set a custom ID prefix for each team member<br/>
            working simultaneously on the project.

            <br/>
            <br/>

            My ID Prefix: <UI.Input
                value={ ID.getCurrentPrefix() }
                onChange={ value => {
                    ID.setCurrentPrefix(value)
                    setRefresh(r => r + 1)
                }}
            />

            </>
        }

    </StyledEditorEmpty>
}


const StyledEditorEmpty = styled.div`
    text-align: center;
`