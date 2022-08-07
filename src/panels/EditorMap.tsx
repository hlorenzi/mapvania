import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as UI from "../ui"
import { global } from "../global"
import { useRefreshByEvent } from "../util/refreshToken"
import { LayerPicker } from "./LayerPicker"
import { TilePicker } from "./TilePicker"
import { RoomProperties } from "./RoomProperties"
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
    const refreshByEditors = useRefreshByEvent("editors")


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
        const onMouseDown = (ev: MouseEvent) => {
            canvas.focus()
            MapEditor.onMouseDown(editor.mapEditor, ev)
        }
        const onMouseMove = (ev: MouseEvent) => MapEditor.onMouseMove(editor.mapEditor, ev)
        const onMouseUp = (ev: MouseEvent) => MapEditor.onMouseUp(editor.mapEditor, ev)
        const onMouseWheel = (ev: WheelEvent) => MapEditor.onMouseWheel(editor.mapEditor, ev)
        const onKeyDown = (ev: KeyboardEvent) => MapEditor.onKey(editor.mapEditor, ev, true)
        const onKeyUp = (ev: KeyboardEvent) => MapEditor.onKey(editor.mapEditor, ev, false)

        onResize()

        window.addEventListener("resize", onResize)
        window.addEventListener("refreshProject", onResize)
        window.addEventListener("refreshEditing", onResize)
        canvas.addEventListener("mousedown", onMouseDown)
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
        canvas.addEventListener("wheel", onMouseWheel)
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)
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
            window.removeEventListener("keyup", onKeyUp)
            canvas.removeEventListener("contextmenu", preventDefault)
            
            resizeObserver.unobserve(canvas)
        }

    }, [canvasRef.current])


    React.useEffect(() =>
    {
        MapEditor.render(editor.mapEditor)

    }, [refreshByEditors, global.editors.refreshToken.refreshValue])


    const chooseTool = (tool: Editors.Tool) =>
    {
        global.editors.mapEditing.tool = tool
        global.editors.refreshToken.commit()
        Editors.render(props.editorIndex)
    }

    const toggleShowGrid = () =>
    {
        global.editors.mapEditing.showGrid =
            global.editors.mapEditing.showGrid === "none" ? "background" :
            global.editors.mapEditing.showGrid === "background" ? "foreground" :
            "none"
            
        global.editors.refreshToken.commit()
        Editors.render(props.editorIndex)
    }

    const toggleShowOtherLayers = () =>
    {
        global.editors.mapEditing.showOtherLayers =
            global.editors.mapEditing.showOtherLayers === "none" ? "normal" :
            global.editors.mapEditing.showOtherLayers === "normal" ? "faded" :
            "none"
            
        global.editors.refreshToken.commit()
        Editors.render(props.editorIndex)
    }

    const toggleTileBrushEdgeBehavior = () =>
    {
        global.editors.mapEditing.tileBrushEdgeBehavior =
            global.editors.mapEditing.tileBrushEdgeBehavior === "none" ? "connectAlways" :
            "none"
            
        global.editors.refreshToken.commit()
        Editors.render(props.editorIndex)
    }

    const capture = () =>
    {
        MapEditor.screenshotRoomSelection(editor.mapEditor, true)
    }

    const captureClean = () =>
    {
        MapEditor.screenshotRoomSelection(editor.mapEditor, false)
    }


    return <div style={{
        display: "grid",
        gridTemplate: "1fr / auto 1fr auto 30em",
        width: "100%",
        height: "100%",
        minHeight: "0",
        overflow: "hidden",
    }}>

        <StyledCanvas
            ref={ canvasRef }
            style={{
                gridRow: 1,
                gridColumn: "1 / 4",
                width: "100%",
                height: "100%",
        }}/>

        <div style={{
            gridRow: 1,
            gridColumn: 1,
            justifySelf: "start",
            alignSelf: "start",
            margin: "1em",
            backgroundColor: "#111",
            borderRadius: "0.25em",
            contain: "paint",
        }}>

            { global.editors.mapEditing.layerDefId === Editors.LAYERDEF_ID_MAP &&
                <>
                <UI.Button
                    label="📐 Move (M)"
                    selected={ global.editors.mapEditing.tool === "move" }
                    onClick={ () => chooseTool("move") }
                />

                <UI.Button
                    label="✒️ Draw (B)"
                    selected={ global.editors.mapEditing.tool === "draw" }
                    onClick={ () => chooseTool("draw") }
                />

                <UI.Button
                    label="✂️ Select (Shift)"
                    selected={ global.editors.mapEditing.tool === "select" }
                    onClick={ () => chooseTool("select") }
                />
                </>
            }
            
            { editingLayerDef && editingLayerDef.type === "tile" &&
                <>
                <UI.Button
                    label="✒️ Draw (B)"
                    selected={ global.editors.mapEditing.tool === "draw" }
                    onClick={ () => chooseTool("draw") }
                />

                <UI.Button
                    label="💧 Fill (G)"
                    selected={ global.editors.mapEditing.tool === "fill" }
                    onClick={ () => chooseTool("fill") }
                />

                <UI.Button
                    label="❌ Erase (E)"
                    selected={ global.editors.mapEditing.tool === "erase" }
                    onClick={ () => chooseTool("erase") }
                />

                <UI.Button
                    label="✂️ Select (Shift)"
                    selected={ global.editors.mapEditing.tool === "select" }
                    onClick={ () => chooseTool("select") }
                />
                </>
            }

            { editingLayerDef && editingLayerDef.type === "object" &&
                <>
                <UI.Button
                    label="📐 Move (M)"
                    selected={ global.editors.mapEditing.tool === "move" }
                    onClick={ () => chooseTool("move") }
                />

                <UI.Button
                    label="✒️ Draw (B)"
                    selected={ global.editors.mapEditing.tool === "draw" }
                    onClick={ () => chooseTool("draw") }
                />

                <UI.Button
                    label="✂️ Select (Shift)"
                    selected={ global.editors.mapEditing.tool === "select" }
                    onClick={ () => chooseTool("select") }
                />
                </>
            }

        </div>

        <div style={{
            gridRow: 1,
            gridColumn: 3,
            justifySelf: "end",
            alignSelf: "start",
            margin: "1em",
            backgroundColor: "#111",
            borderRadius: "0.25em",
            contain: "paint",
        }}>
            <UI.Button
                label={
                    "🌐 Grid: " +
                    (global.editors.mapEditing.showGrid === "background" ? "Back" :
                    global.editors.mapEditing.showGrid === "foreground" ? "Front" :
                    "Off") }
                onClick={ toggleShowGrid }
            />
            <UI.Button
                label={
                    "🧅 Other Layers: " +
                    (global.editors.mapEditing.showOtherLayers === "normal" ? "Normal" :
                    global.editors.mapEditing.showOtherLayers === "faded" ? "Faded" :
                    "Off") }
                onClick={ toggleShowOtherLayers }
            />
            <br/>
            <UI.Button
                label={
                    "🖌️ Brush at Edges: " +
                    (global.editors.mapEditing.tileBrushEdgeBehavior === "connectAlways" ? "Connect to OoB" :
                    "Ignore") }
                onClick={ toggleTileBrushEdgeBehavior }
            />
        </div>

        <div style={{
            gridRow: 1,
            gridColumn: 1,
            justifySelf: "start",
            alignSelf: "end",
            margin: "1em",
            backgroundColor: "#111",
            borderRadius: "0.25em",
            contain: "paint",
        }}>
            <UI.Button
                label="📷 Capture (F2)"
                onClick={ capture }
            />
            
            <UI.Button
                label="📷 Capture Clean (F3)"
                onClick={ captureClean }
            />
        </div>

        <div style={{
            gridRow: 1,
            gridColumn: 4,
            width: "100%",
            height: "100%",
            minHeight: "0",
            display: "grid",
            gridTemplate: "auto 1fr / 1fr",
            gridGap: "0.5em",
            pointerEvents: "none",
        }}>

            { editor.mapEditor && editor.mapEditor.objectSelection.size > 0 ?
                <ObjectProperties
                    editorIndex={ props.editorIndex }
                />
            : editor.mapEditor && editor.mapEditor.roomSelection.size > 0 ?
                <>
                <LayerPicker
                    editorIndex={ props.editorIndex }
                />
                <RoomProperties
                    editorIndex={ props.editorIndex }
                />
                </>
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
}