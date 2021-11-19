import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import * as Project from "../project/index"
import * as Editor from "./editor/index"
import { PanelPadding } from "../ui/PanelPadding"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { List } from "../ui/List"
import { Grid, Cell } from "../ui/Grid"
import { global, LAYER_ID_WORLD } from "../global"
import styled from "styled-components"


const StyledCanvas = styled.canvas`
    width: 100%;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    grid-row: 1;
    grid-column: 1;
`


export function WorldEditor(props: {
    worldId: Project.ID,
})
{
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const stateRef = React.useRef<Editor.State>()

    const world = Project.getWorld(global.project, props.worldId)
    const editingLayerDef = Project.getLayerDef(global.project, global.editingLayerId)


    React.useEffect(() =>
    {
        if (!canvasRef.current)
            return

        if (!stateRef.current)
            stateRef.current = Editor.createState(props.worldId, world?.stages[0].id ?? -1)

        const canvas = canvasRef.current
        stateRef.current.canvas = canvas
        stateRef.current.ctx = canvas.getContext("2d")!

        const preventDefault = (ev: Event) => ev.preventDefault()
        const onResize = () => Editor.onResize(stateRef.current!)
        const onMouseDown = (ev: MouseEvent) => Editor.onMouseDown(stateRef.current!, ev)
        const onMouseMove = (ev: MouseEvent) => Editor.onMouseMove(stateRef.current!, ev)
        const onMouseUp = (ev: MouseEvent) => Editor.onMouseUp(stateRef.current!, ev)
        const onMouseWheel = (ev: WheelEvent) => Editor.onMouseWheel(stateRef.current!, ev)
        const onKeyDown = (ev: KeyboardEvent) => Editor.onKeyDown(stateRef.current!, ev)

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


    if (!world)
        return null


    const ctx = Dockable.useContentContext()
    ctx.setTitle(world.name)
    ctx.setPreferredSize(600, 500)


    const chooseTileTool = (tool: typeof global.editingTileTool) =>
    {
        global.editingTileTool = tool
        global.editingToken.commit()
    }


    return <PanelPadding noOverflow>

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
                backgroundColor: "var(--dockable-panelBkg)",
            }}>
                { global.editingLayerId === LAYER_ID_WORLD &&
                    <>
                    <Button
                        label="📐 Move (M)"
                        selected={ global.editingTileTool === "move" }
                        onClick={ () => chooseTileTool("move") }
                    />

                    <Button
                        label="✒️ Draw (B)"
                        selected={ global.editingTileTool === "draw" }
                        onClick={ () => chooseTileTool("draw") }
                    />

                    <Button
                        label="✂️ Select (Shift)"
                        selected={ global.editingTileTool === "select" }
                        onClick={ () => chooseTileTool("select") }
                    />
                    </>
                }
                
                { editingLayerDef && editingLayerDef.type === "tile" &&
                    <>
                    <Button
                        label="✒️ Draw (B)"
                        selected={ global.editingTileTool === "draw" }
                        onClick={ () => chooseTileTool("draw") }
                    />

                    <Button
                        label="❌ Erase (E)"
                        selected={ global.editingTileTool === "erase" }
                        onClick={ () => chooseTileTool("erase") }
                    />

                    <Button
                        label="✂️ Select (Shift)"
                        selected={ global.editingTileTool === "select" }
                        onClick={ () => chooseTileTool("select") }
                    />
                    </>
                }

            </div>

            <StyledCanvas
                ref={ canvasRef }
            />

        </div>

    </PanelPadding>
}