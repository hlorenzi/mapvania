import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as UI from "../ui"
import { global } from "../global"
import { LayerPicker } from "./LayerPicker"
import { TilePicker } from "./TilePicker"
import { ObjectPicker } from "./ObjectPicker"
import { ObjectProperties } from "./ObjectProperties"


const StyledCanvas = styled.canvas`
    width: 100%;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    grid-row: 1;
    grid-column: 1;
`


export function EditorMap(props: {
    editorIndex: number
})
{
    const canvasRef = React.useRef<HTMLCanvasElement>(null)


    const editor = global.editors.editors[props.editorIndex] as Editors.EditorMap
    const editingLayerDef = editor.defs.layerDefs.find(l => l.id === global.editors.mapEditing.layerDefId)


    React.useEffect(() =>
    {
        if (!canvasRef.current)
            return

        const canvas = canvasRef.current
        editor.mapEditor.canvas = canvas
        editor.mapEditor.ctx = canvas.getContext("2d")!

        const preventDefault = (ev: Event) => ev.preventDefault()
        const onResize = () => MapEditor.onResize(editor.mapEditor)
        const onMouseDown = (ev: MouseEvent) => MapEditor.onMouseDown(editor.mapEditor, ev)
        const onMouseMove = (ev: MouseEvent) => MapEditor.onMouseMove(editor.mapEditor, ev)
        const onMouseUp = (ev: MouseEvent) => MapEditor.onMouseUp(editor.mapEditor, ev)
        const onMouseWheel = (ev: WheelEvent) => MapEditor.onMouseWheel(editor.mapEditor, ev)
        const onKeyDown = (ev: KeyboardEvent) => MapEditor.onKeyDown(editor.mapEditor, ev)

        onResize()

        window.addEventListener("resize", onResize)
        window.addEventListener("refreshProject", onResize)
        window.addEventListener("refreshEditing", onResize)
        canvas.addEventListener("mousedown", onMouseDown)
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
        canvas.addEventListener("wheel", onMouseWheel)
        window.addEventListener("keydown", onKeyDown)
        canvas.addEventListener("contextmenu", preventDefault)

        const resizeObserver = new ResizeObserver(entries =>
        {
            window.dispatchEvent(new Event("resize"))
        })

        resizeObserver.observe(canvas)
    
        return () =>
        {
            window.removeEventListener("resize", onResize)
            window.removeEventListener("refreshProject", onResize)
            window.removeEventListener("refreshEditing", onResize)
            canvas.removeEventListener("mousedown", onMouseDown)
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
            canvas.removeEventListener("wheel", onMouseWheel)
            window.removeEventListener("keydown", onKeyDown)
            canvas.removeEventListener("contextmenu", preventDefault)
            
            resizeObserver.unobserve(canvas)
        }

    }, [canvasRef.current])


    React.useEffect(() =>
    {
        console.log("refresh map editor")
        MapEditor.render(editor.mapEditor)

    }, [global.editors.refreshToken.refreshValue])


    const chooseTileTool = (tool: Editors.TileTool) =>
    {
        global.editors.mapEditing.tileTool = tool
        global.editors.refreshToken.commit()
    }


    return <UI.PanelPadding noOverflow>

        <div style={{
            display: "grid",
            gridTemplate: "1fr / 1fr",
            width: "100%",
            height: "100%",
            minHeight: "0",
        }}>

            <div style={{
                gridRow: 1,
                gridColumn: 1,
                position: "relative",
                top: "1em",
                left: "1em",
                justifySelf: "start",
                alignSelf: "start",
                backgroundColor: "#111111",
            }}>
                { global.editors.mapEditing.layerDefId === Editors.LAYERDEF_ID_WORLD &&
                    <>
                    <UI.Button
                        label="📐 Move (M)"
                        selected={ global.editors.mapEditing.tileTool === "move" }
                        onClick={ () => chooseTileTool("move") }
                    />

                    <UI.Button
                        label="✒️ Draw (B)"
                        selected={ global.editors.mapEditing.tileTool === "draw" }
                        onClick={ () => chooseTileTool("draw") }
                    />

                    <UI.Button
                        label="✂️ Select (Shift)"
                        selected={ global.editors.mapEditing.tileTool === "select" }
                        onClick={ () => chooseTileTool("select") }
                    />
                    </>
                }
                
                { editingLayerDef && editingLayerDef.type === "tile" &&
                    <>
                    <UI.Button
                        label="✒️ Draw (B)"
                        selected={ global.editors.mapEditing.tileTool === "draw" }
                        onClick={ () => chooseTileTool("draw") }
                    />

                    <UI.Button
                        label="❌ Erase (E)"
                        selected={ global.editors.mapEditing.tileTool === "erase" }
                        onClick={ () => chooseTileTool("erase") }
                    />

                    <UI.Button
                        label="✂️ Select (Shift)"
                        selected={ global.editors.mapEditing.tileTool === "select" }
                        onClick={ () => chooseTileTool("select") }
                    />
                    </>
                }

                { editingLayerDef && editingLayerDef.type === "object" &&
                    <>
                    <UI.Button
                        label="📐 Move (M)"
                        selected={ global.editors.mapEditing.tileTool === "move" }
                        onClick={ () => chooseTileTool("move") }
                    />

                    <UI.Button
                        label="✒️ Draw (B)"
                        selected={ global.editors.mapEditing.tileTool === "draw" }
                        onClick={ () => chooseTileTool("draw") }
                    />

                    <UI.Button
                        label="✂️ Select (Shift)"
                        selected={ global.editors.mapEditing.tileTool === "select" }
                        onClick={ () => chooseTileTool("select") }
                    />
                    </>
                }

            </div>

            <StyledCanvas
                ref={ canvasRef }
            />

            <div style={{
                gridRow: 1,
                gridColumn: 1,
                width: "100%",
                height: "100%",
                minHeight: "0",
                display: "grid",
                gridTemplate: "1fr / 1fr 25em",
                pointerEvents: "none",
                padding: "0.5em",
            }}>

                <div/>

                <div style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "0",
                    display: "grid",
                    gridTemplate: "auto 1fr / 1fr",
                    gridGap: "0.5em",
                    pointerEvents: "none",
                    padding: "0.5em",
                }}>

                    { editor.mapEditor && editor.mapEditor.objectSelection.size > 0 ?
                        <ObjectProperties
                            editorIndex={ props.editorIndex }
                        />
                    :
                        <>
                        <LayerPicker
                            editorIndex={ props.editorIndex }
                        />

                        { editingLayerDef && editingLayerDef.type === "tile" &&
                            <TilePicker
                                editorIndex={ props.editorIndex }
                            />
                        }

                        { editingLayerDef && editingLayerDef.type === "object" &&
                            <ObjectPicker
                                editorIndex={ props.editorIndex }
                            />
                        }
                        </>
                    }

                </div>

            </div>


        </div>

    </UI.PanelPadding>
}