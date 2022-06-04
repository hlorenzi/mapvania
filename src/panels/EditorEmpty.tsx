import * as React from "react"
import styled from "styled-components"
import { global } from "../global"
import * as Actions from "../actions"
import * as Filesystem from "../data/filesystem"


export function EditorEmpty()
{
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

            <button
                onClick={ Actions.openFolder.func }
            >
                📁 Choose folder...
            </button>

            { hasCachedFolder &&
                <>
                <br/>
                <br/>
                <button
                    onClick={ Filesystem.setRootDirectoryFromCache }
                >
                    or reopen previous project folder.
                </button>
                </>
            }
            </>
        }

    </StyledEditorEmpty>
}


const StyledEditorEmpty = styled.div`
    text-align: center;
`