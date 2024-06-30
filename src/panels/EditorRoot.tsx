import * as Solid from "solid-js"
import { styled } from "solid-styled-components"
import { Tabs } from "./Tabs.tsx"
import { EditorEmpty } from "./EditorEmpty.tsx"
import { EditorDefs } from "./EditorDefs.tsx"
import { EditorMap } from "./EditorMap.tsx"


export function EditorRoot()
{
    //const currentEditor =
    //    global.editors.currentEditor < 0 ? undefined :
    //    global.editors.editors[global.editors.currentEditor]

    return <StyledEditorRoot>

        <EditorEmpty/>

        {/*<Tabs/>

        { !currentEditor && <EditorEmpty/> }

        { currentEditor?.type === "defs" &&
            <EditorDefs
                key={ global.editors.currentEditor }
                editorIndex={ global.editors.currentEditor }
            />
        }

        { currentEditor?.type === "map" &&
            <EditorMap
                key={ global.editors.currentEditor }
                editorIndex={ global.editors.currentEditor }
            />
        }*/}

    </StyledEditorRoot>
}


const StyledEditorRoot = styled.div`
    grid-row: 2;
    grid-column: 2;

    width: 100%;
    height: 100%;
    max-height: 100%;
    min-height: 0;

    display: grid;
    grid-template: auto 1fr / 1fr;
    align-items: center;
    justify-items: center;
`