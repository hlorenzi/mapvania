import * as Solid from "solid-js"
import * as SolidWeb from "solid-js/web"
import * as Global from "./global.ts"
import * as Filesystem from "./data/filesystem.ts"
import { ProjectTree } from "./panels/ProjectTree.tsx"
import { EditorRoot } from "./panels/EditorRoot.tsx"


SolidWeb.render(App, document.getElementById("app")!)


function App()
{
    const filesystem = Solid.createSignal(Filesystem.makeNew())

    //Events.useKeyboardShortcuts()
    //Events.useWindowFocusEvent()


    return <>
        <Global.CtxFilesystem.Provider value={ filesystem }>
            <div style={{
                display: "grid",
                "grid-template": "auto 1fr / auto 1fr",
                width: "100%",
                height: "100vh",
                "font-size": "0.8em",
            }}>

                <ProjectTree/>

                <EditorRoot/>

            </div>
        </Global.CtxFilesystem.Provider>
    </>
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