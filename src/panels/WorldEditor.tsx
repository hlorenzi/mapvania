import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import * as Project from "project"
import * as Editor from "./editor/index"
import { PanelPadding } from "../ui/PanelPadding"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { List } from "../ui/List"
import { Grid, Cell } from "../ui/Grid"
import { global, deepAssignProject } from "../global"
import styled from "styled-components"


const StyledCanvas = styled.canvas`
    width: 100%;
    height: 100%;
    box-sizing: border-box;
`


export function WorldEditor(props: {
    worldId: Project.ID,
})
{
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const stateRef = React.useRef<Editor.State>()

    const world = global.project.worlds.find(l => l.id === props.worldId)


    React.useEffect(() =>
    {
        if (!canvasRef.current)
            return

        if (!stateRef.current)
            stateRef.current = Editor.createState(props.worldId, world?.stages[0].id ?? -1)

        const canvas = canvasRef.current
        stateRef.current.canvas = canvas
        stateRef.current.ctx = canvas.getContext("2d")!

        const onResize = () => Editor.onResize(stateRef.current!)
        const onMouseDown = (ev: MouseEvent) => Editor.onMouseDown(stateRef.current!, ev)
        const onMouseMove = (ev: MouseEvent) => Editor.onMouseMove(stateRef.current!, ev)
        const onMouseUp = (ev: MouseEvent) => Editor.onMouseUp(stateRef.current!, ev)
        const onMouseWheel = (ev: WheelEvent) => Editor.onMouseWheel(stateRef.current!, ev)

        onResize()

        window.addEventListener("resize", onResize)
        canvas.addEventListener("mousedown", onMouseDown)
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
        canvas.addEventListener("wheel", onMouseWheel)

        const resizeObserver = new ResizeObserver(entries =>
        {
            window.dispatchEvent(new Event("resize"))
        })

        resizeObserver.observe(canvas)
    
        return () =>
        {
            window.removeEventListener("resize", onResize)
            canvas.removeEventListener("mousedown", onMouseDown)
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
            canvas.removeEventListener("wheel", onMouseWheel)
            
            resizeObserver.unobserve(canvas)
        }

    }, [canvasRef.current])
    

    if (!world)
        return null

    const ctx = Dockable.useContentContext()
    ctx.setTitle(world.name)
    ctx.setPreferredSize(600, 500)


    return <PanelPadding noOverflow>

        <StyledCanvas
            ref={ canvasRef }
        />

    </PanelPadding>
}