import * as React from "react"
import styled from "styled-components"
import { global } from "../global"
import * as Filesystem from "../data/filesystem"
import * as Dev from "../data/dev"
import * as ID from "../data/id"
import * as UI from "../ui"


const githubRepoHref = "https://github.com/hlorenzi/mapvania"
const githubHashTreeHref = "https://github.com/hlorenzi/mapvania/tree/"


interface VersionData
{
    displayStr: string
    major: number
    minor: number
    hash: string
}


function decodeVersionData(str: string): VersionData
{
    const data: VersionData =
    {
        displayStr: "",
        major: 0,
        minor: 0,
        hash: "development",
    }

    const matches = str.match(/v(.*?)-(.*?)-g(.*)/)
    if (!matches)
        return data

    data.major = parseInt(matches[1])
    data.minor = parseInt(matches[2])
    data.hash = matches[3]

    if (data.major !== 0 ||
        data.minor !== 0)
    {
        data.displayStr = `v${ data.major }.${ data.minor }`
    }

    return data
}


export function EditorEmpty()
{
    const [ready, setReady] = React.useState(false)

    const [refresh, setRefresh] = React.useState(0)
    const [hasCachedFolder, setHasCachedFolder] = React.useState(false)
    
    const [versionDataStr, setVersionDataStr] = React.useState("")
    const versionData = decodeVersionData(versionDataStr)

    document.title = `Mapvania ${ versionData.displayStr }`


    React.useEffect(() =>
    {
        window.requestAnimationFrame(async () =>
        {
            try
            {
                if (await Filesystem.retrieveCachedRootFolder())
                    setHasCachedFolder(true)
                
                const versionFile = await fetch("build/version.txt")
                const versionStr = await versionFile.text()
                setVersionDataStr(versionStr.trim())
            }
            finally
            {
                setReady(true)
            }
        })

    }, [])


    return <StyledEditorEmpty>

        { ready && !global.filesystem.root.handle &&
            <>
            <div>
                <span style={{
                    fontSize: "5em",
                }}>
                    Mapvania
                </span>
    
                <span style={{
                    position: "relative",
                    top: "0.25em",
                    marginLeft: "0.5em",
                    opacity: 0.85,
                }}>
                    v{ versionData.major }.{ versionData.minor }
                </span>
    
                <br/>
    
                <span>
                    <a
                        href={ githubRepoHref }
                    >
                        GitHub Repository
                    </a>
    
                    { " — " }
    
                    Git: <a
                        href={ githubHashTreeHref + versionData.hash }
                    >
                        { versionData.hash }
                    </a>
                </span>
            </div>
    
            <br/>
            <br/>
            <br/>
            <br/>

            <UI.Button
                onClick={ Filesystem.openRootDirectory }
            >
                📁 Open project folder...
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
            
            <br/>
            <br/>
            <UI.HorizontalBar/>
            <br/>

            Automatically write a { Filesystem.DEV_FILENAME } file with useful dev information,<br/>
            like the current map and room being edited.

            <br/>
            <br/>

            <UI.Checkbox
                label={ `Write ${ Filesystem.DEV_FILENAME } file` }
                value={ Dev.getCurrentWriteDevFile() }
                onChange={ value => {
                    Dev.setCurrentWriteDevFile(value)
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