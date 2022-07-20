import * as React from "react"
import * as ReactDOM from "react-dom"
import { global, initGlobal } from "./global"
import * as Events from "./events"
import { useRefreshToken } from "./util/refreshToken"
import { EditorRoot } from "./panels/EditorRoot"
import { ProjectTree } from "./panels/ProjectTree"
import * as Filesystem from "./data/filesystem"
import * as Editors from "./data/editors"


window.requestAnimationFrame(async () =>
{
    const versionFile = await fetch("build/version.txt")
    const versionTxt = await versionFile.text()
    if (versionTxt.startsWith("v0-"))
    {
        const version = versionTxt.match(".*?\-(.*?)\-")![1]
        document.title = "Mapvania v0." + version
    }
})


function App()
{
    const filesystemRefreshToken = useRefreshToken("filesystem")
    const editorsRefreshToken = useRefreshToken("editors")
    const imagesRefreshToken = useRefreshToken("images")

    
    Events.useKeyboardShortcuts()


    const initialized = React.useRef(false)
    if (!initialized.current)
    {
        initialized.current = true

        initGlobal(
            filesystemRefreshToken,
            editorsRefreshToken,
            imagesRefreshToken,
        )
    }


    return <div style={{
        display: "grid",
        gridTemplate: "auto 1fr / auto 1fr",
        width: "100%",
        height: "100vh",
        fontSize: "0.8em",
    }}>

        <ProjectTree/>

        <EditorRoot/>

    </div>
}


window.addEventListener("beforeunload", (ev) =>
{
    if (Editors.isAnyEditorUnsaved())
    {
        ev.preventDefault()
        ev.returnValue = "Lose unsaved changes?"
        return ev.returnValue
    }
})


document.body.onload = function()
{
	ReactDOM.render(<App/>, document.getElementById("divApp"))
}