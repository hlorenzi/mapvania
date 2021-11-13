import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Dockable from "@hlorenzi/react-dockable"
import { WorldPicker } from "./panels/WorldPicker"
import { GlobalDefs } from "./panels/GlobalDefs"
import { global } from "./global"
import * as Project from "./project"
import { useUpdateToken } from "./util/updateToken"


function App()
{
    const projectToken = useUpdateToken()


    const initialized = React.useRef(false)
    if (!initialized.current)
    {
        initialized.current = true

        global.project = Project.projectCreate()
        global.projectToken = projectToken
    }


    const dockableState = Dockable.useDockable((state) =>
    {
        Dockable.createDockedPanel(
            state, state.rootPanel, Dockable.DockMode.Full,
            <GlobalDefs/>)

        Dockable.createDockedPanel(
            state, state.rootPanel, Dockable.DockMode.Bottom,
            <WorldPicker/>)
    })


    return <div style={{
        display: "grid",
        gridTemplate: "auto 1fr / 1fr",
        width: "100%",
        height: "100vh",
    }}>

        <div style={{
            padding: "0.5em",
            display: "grid",
            gridTemplate: "auto / auto auto auto 1fr",
            gridGap: "0.25em",
        }}>
            
        </div>

        <Dockable.Container state={ dockableState }/>

    </div>
}


document.body.onload = function()
{
	ReactDOM.render(<App/>, document.getElementById("divApp"))
}