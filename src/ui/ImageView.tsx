import * as React from "react"
import styled from "styled-components"
import * as Events from "../events"


export interface ImageViewState
{
    onMouseMove: null | ((state: ImageViewState) => void),
    onMouseUp: null | ((state: ImageViewState) => void),
    mouseDown: boolean,
    mouse: {
        posRaw: { x: number, y: number },
        pos: { x: number, y: number },
    },
    mouseDownOrigin: {
        posRaw: { x: number, y: number },
        pos: { x: number, y: number },
    },
    mouseDownDelta: {
        posRaw: { x: number, y: number },
        pos: { x: number, y: number },
    },
    camera: {
        pos: { x: number, y: number },
        zoom: number,
    }
}


export function ImageView(props: {
    imageData?: HTMLImageElement,
    onMouseDown?: (state: ImageViewState) => void,
    onRender?: (ctx: CanvasRenderingContext2D) => void,
    style?: React.CSSProperties,
})
{
    const refCanvas = React.useRef<HTMLCanvasElement>(null)

    const state = React.useRef<ImageViewState>({
        onMouseMove: null,
        onMouseUp: null,
        mouseDown: false,
        mouse: {
            posRaw: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
        },
        mouseDownOrigin: {
            posRaw: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
        },
        mouseDownDelta: {
            posRaw: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
        },
        camera: {
            pos: { x: 0, y: 0 },
            zoom: 1,
        }
    })


    React.useEffect(() =>
    {
        if (!props.imageData)
            return
        
        const canvas = refCanvas.current
        if (!canvas)
            return

        state.current.camera.pos = { x: 0, y: 0 }
        state.current.camera.zoom = 1

        for (let z = -10; z <= 4; z++)
        {
            const zoom = Math.pow(1.5, z)

            if (props.imageData.width * zoom < canvas.clientWidth - 16 &&
                props.imageData.height * zoom < canvas.clientHeight - 16)
            {
                state.current.camera.zoom = zoom
            }
        }


    }, [props.imageData, props.imageData?.width, props.imageData?.height])


    React.useEffect(() =>
    {
        const canvas = refCanvas.current
        if (!canvas)
            return

        const ctx = canvas.getContext("2d")!


        const updateMouse = (ev: MouseEvent) =>
        {
            const canvasRect = canvas.getBoundingClientRect()
            const imgW = props.imageData?.width ?? 0
            const imgH = props.imageData?.height ?? 0
            
            const pixelRatio =
                window.devicePixelRatio || 1

            state.current.mouse.posRaw = {
                x: (ev.clientX - canvasRect.left) * pixelRatio,
                y: (ev.clientY - canvasRect.top) * pixelRatio,
            }

            state.current.mouse.pos = {
                x: (state.current.mouse.posRaw.x - canvas.width  / 2 + state.current.camera.pos.x) / state.current.camera.zoom + imgW / 2,
                y: (state.current.mouse.posRaw.y - canvas.height / 2 + state.current.camera.pos.y) / state.current.camera.zoom + imgH / 2,
            }

            state.current.mouseDownDelta.posRaw = {
                x: state.current.mouse.posRaw.x - state.current.mouseDownOrigin.posRaw.x,
                y: state.current.mouse.posRaw.y - state.current.mouseDownOrigin.posRaw.y,
            }

            state.current.mouseDownDelta.pos = {
                x: state.current.mouse.pos.x - state.current.mouseDownOrigin.pos.x,
                y: state.current.mouse.pos.y - state.current.mouseDownOrigin.pos.y,
            }
        }
            
        
        const onMouseDown = (ev: MouseEvent) =>
        {
            ev.preventDefault()
            
            if (state.current.onMouseMove)
                return

            Events.startMouseCapture()
            updateMouse(ev)
            
            state.current.mouseDown = true

            state.current.mouseDownOrigin =
            {
                posRaw: state.current.mouse.posRaw,
                pos: state.current.mouse.pos,
            }

            if (!props.onMouseDown || ev.button != 0)
            {
                const cameraPosOriginal = state.current.camera.pos
            
                state.current.onMouseMove = () =>
                {
                    state.current.camera.pos =
                    {
                        x: cameraPosOriginal.x - state.current.mouseDownDelta.posRaw.x,
                        y: cameraPosOriginal.y - state.current.mouseDownDelta.posRaw.y,
                    }
                }
            }
            else if (props.onMouseDown)
                props.onMouseDown(state.current)
            
            onMouseMove(ev)
        }


        const onMouseMove = (ev: MouseEvent) =>
        {
            updateMouse(ev)

            if (state.current.onMouseMove)
                state.current.onMouseMove(state.current)

            render()
        }


        const onMouseUp = (ev: MouseEvent) =>
        {
            ev.preventDefault()
            Events.endMouseCapture()

            onMouseMove(ev)

            if (state.current.onMouseUp)
                state.current.onMouseUp(state.current)

            state.current.mouseDown = false
            state.current.onMouseMove = null
            state.current.onMouseUp = null
        }


        const onMouseWheel = (ev: WheelEvent) =>
        {
            onMouseMove(ev)

            const mousePrevious = state.current.mouse.pos

            state.current.camera.zoom *= ev.deltaY < 0 ? 1.5 : 1 / 1.5
            
            onMouseMove(ev)

            state.current.camera.pos = {
                x: state.current.camera.pos.x + (mousePrevious.x - state.current.mouse.pos.x) * state.current.camera.zoom,
                y: state.current.camera.pos.y + (mousePrevious.y - state.current.mouse.pos.y) * state.current.camera.zoom,
            }
            
            onMouseMove(ev)
            
            render()
        }


        const onContextMenu = (ev: Event) =>
        {
            ev.preventDefault()
        }
            


        const render = () =>
        {
            const pixelRatio =
                window.devicePixelRatio || 1

            canvas.width = Math.round(canvas.clientWidth * pixelRatio)
            canvas.height = Math.round(canvas.clientHeight * pixelRatio)
    
            const imgW = props.imageData?.width ?? 0
            const imgH = props.imageData?.height ?? 0
    
            ctx.save()
            ctx.clearRect(0, 0, canvas.width, canvas.height)
    
            ctx.lineWidth = 1 / state.current.camera.zoom

            ctx.translate(
                Math.floor(canvas.width  / 2 - state.current.camera.pos.x) + 0.5,
                Math.floor(canvas.height / 2 - state.current.camera.pos.y) + 0.5)
    
            ctx.scale(state.current.camera.zoom, state.current.camera.zoom)

            ctx.translate(
                Math.floor(-imgW / 2),
                Math.floor(-imgH / 2))
    
            ctx.fillStyle = "#242424"
            ctx.fillRect(0, 0, imgW, imgH)
    
            if (props.imageData)
            {
                ctx.imageSmoothingQuality = "low"
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(props.imageData, 0, 0)
            }
        
            if (props.onRender)
                props.onRender(ctx)
    
            ctx.restore()
        }
        

        canvas.addEventListener("mousedown", onMouseDown)
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
        canvas.addEventListener("wheel", onMouseWheel)
        canvas.addEventListener("contextmenu", onContextMenu)

        return () =>
        {
            canvas.removeEventListener("mousedown", onMouseDown)
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
            canvas.removeEventListener("wheel", onMouseWheel)
            canvas.removeEventListener("contextmenu", onContextMenu)
        }

    }, [props.imageData, props.onMouseDown, props.onRender])


    return <StyledImageView
        style={ props.style }
    >
        <canvas
            ref={ refCanvas }
            style={{
                width: "100%",
                height: "100%",
                maxHeight: "100%",
                minHeight: "0",
        }}/>

    </StyledImageView>
}


const StyledImageView = styled.div`
    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: #111111;

    width: 100%;
    height: 100%;
    max-height: 100%;

    overflow-x: hidden;
    overflow-y: hidden;

    box-sizing: border-box;
    border: 0;
    outline: none;
    border-radius: 0;
`