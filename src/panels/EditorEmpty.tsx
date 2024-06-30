import * as Solid from "solid-js"
import { styled } from "solid-styled-components"
import * as Global from "../global.ts"
import * as Filesystem from "../data/filesystem.ts"
import * as Dev from "../data/dev.ts"
import * as ID from "../data/id.ts"
import * as UI from "../ui/index.ts"


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
    const filesystem = Global.useFilesystem()

    const [ready, setReady] = Solid.createSignal(false)

    const [hasCachedFolder, setHasCachedFolder] = Solid.createSignal(false)
    
    const [versionDataStr, setVersionDataStr] = Solid.createSignal("")
    const versionData = Solid.createMemo(
        () => decodeVersionData(versionDataStr()))

    Solid.createComputed(() => {
        document.title = `Mapvania ${ versionData().displayStr }`
        return versionData()
    })

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


    return <StyledEditorEmpty>

        <Solid.Show when={ ready() && !filesystem[0]().root.handle }>

            <div>
                <span style={{
                    "font-size": "5em",
                }}>
                    Mapvania
                </span>
    
                <span style={{
                    position: "relative",
                    top: "0.25em",
                    "margin-left": "0.5em",
                    opacity: 0.85,
                }}>
                    v{ versionData().major }.{ versionData().minor }
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
                        href={ githubHashTreeHref + versionData().hash }
                    >
                        { versionData().hash }
                    </a>
                </span>
            </div>
    
            <br/>
            <br/>
            <br/>
            <br/>

            <UI.Button
                onClick={ () => Filesystem.openRootDirectory(filesystem) }
            >
                📁 Open project folder...
            </UI.Button>

            <Solid.Show when={ hasCachedFolder() }>
                <br/>
                <br/>
                <UI.Button
                    onClick={ () => Filesystem.setRootDirectoryFromCache(filesystem) }
                >
                    🔁 Reopen previous project folder
                </UI.Button>
            </Solid.Show>

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
                initialValue={ ID.getCurrentPrefix() }
                onChange={ value => ID.setCurrentPrefix(value) }
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
                initialValue={ Dev.getCurrentWriteDevFile() }
                onChange={ value => Dev.setCurrentWriteDevFile(value) }
            />

        </Solid.Show>

    </StyledEditorEmpty>
}


const StyledEditorEmpty = styled.div`
    text-align: center;
`