import * as React from "react"
import * as ReactDOM from "react-dom"
import { global, initGlobal } from "./global"
import * as Keyboard from "./keyboard"
import { useRefreshToken } from "./util/refreshToken"
import { EditorRoot } from "./panels/EditorRoot"
import { ProjectTree } from "./panels/ProjectTree"
import * as Filesystem from "./data/filesystem"


function App()
{
    const filesystemRefreshToken = useRefreshToken("filesystem")
    const editorsRefreshToken = useRefreshToken("editors")
    const imagesRefreshToken = useRefreshToken("images")

    
    Keyboard.useKeyboardShortcuts()


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


document.body.onload = function()
{
	ReactDOM.render(<App/>, document.getElementById("divApp"))
}