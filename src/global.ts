import * as React from "react"
import * as Project from "./project"
import { UpdateToken } from "./util/updateToken"
import { deepAssign, DeepAssignable } from "./util/deepAssign"


export interface Global
{
    projectToken: UpdateToken
    project: Project.Project

    history: HistoryStep[]
    historyPointer: number

    editingToken: UpdateToken
    editingLayerId: Project.ID

    editingTileTool: TileTool
    editingTileToolBeforeKeyToggle: TileTool
    editingTileToolKeyToggled: boolean

    editingTilesetId: Project.ID
    editingTilesetStampSet: Set<number>
    editingTileStamp: Project.TileField

    images: { [id: Project.ID]: HTMLImageElement }
}


export interface HistoryStep
{
    project: Project.Project
    marker: string | undefined
}


export type TileTool = "draw" | "erase" | "select"


export const global: Global =
{
    projectToken: null!,
    project: null!,

    history: [],
    historyPointer: 0,

    editingToken: null!,
    editingLayerId: -1,

    editingTileTool: "draw",
    editingTileToolBeforeKeyToggle: "draw",
    editingTileToolKeyToggled: false,

    editingTilesetId: -1,
    editingTilesetStampSet: new Set(),
    editingTileStamp: { tiles: [], width: 0, height: 0 },

    images: {},
}


export function deepAssignProject(value: DeepAssignable<Project.Project>)
{
    global.project = deepAssign(global.project, value)
    global.projectToken.commit()
}


export function addHistory(marker?: string)
{
    if (global.history.length > 0 &&
        global.history[global.history.length - 1].project === global.project)
        return
    
    global.history = global.history.slice(0, global.historyPointer + 1)

    global.history.push({
        project: global.project,
        marker: marker,
    })

    global.historyPointer = global.history.length - 1
}


export function undo()
{
    if (global.historyPointer - 1 < 0)
        return
    
    global.historyPointer -= 1
    global.project = global.history[global.historyPointer].project
    global.projectToken.commit()
}


export function redo()
{
    if (global.historyPointer + 1 >= global.history.length)
        return
    
    global.historyPointer += 1
    global.project = global.history[global.historyPointer].project
    global.projectToken.commit()
}


export function useKeyboardShortcuts()
{
    React.useEffect(() =>
    {
        const onKeyDown = (ev: KeyboardEvent) =>
        {
            const key = ev.key.toLowerCase()

            switch (key)
            {
                case "b":
                    global.editingTileTool = "draw"
                    global.editingToken.commit()
                    break
                    
                case "e":
                    global.editingTileTool = "erase"
                    global.editingToken.commit()
                    break
                    
                case "shift":
                    if (!global.editingTileToolKeyToggled)
                    {
                        global.editingTileToolBeforeKeyToggle = global.editingTileTool
                        global.editingTileToolKeyToggled = true
                    }
                    global.editingTileTool = "select"
                    global.editingToken.commit()
                    break
                    
                case "z":
                    if (ev.ctrlKey)
                    {
                        if (ev.shiftKey)
                            redo()
                        else
                            undo()
                    }
                    break
                    
                case "y":
                    if (ev.ctrlKey)
                        redo()
                    break
            }
        }


        const onKeyUp = (ev: KeyboardEvent) =>
        {
            const key = ev.key.toLowerCase()

            switch (key)
            {
                case "shift":
                    if (global.editingTileTool === "select" &&
                        global.editingTileToolKeyToggled)
                    {
                        global.editingTileTool = global.editingTileToolBeforeKeyToggle
                        global.editingToken.commit()
                    }
                    break
            }

            global.editingTileToolKeyToggled = false
        }


        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)

        return () =>
        {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
        }

    }, [])
}


export async function openTilesetImage(): Promise<Project.ID>
{
    const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
            description: "PNG Images",
            accept: {
                "image/png": [".png"],
            },
        }]
    })
    
    const file = await handle.getFile()
    const bytes = await file.arrayBuffer()
    const imgData = await getImageData(bytes)

    const imageId = global.project.nextId
    global.images[imageId] = imgData
    deepAssignProject({ nextId: imageId + 1 })
    return imageId
}


export async function getImageData(rawData: ArrayBuffer): Promise<HTMLImageElement>
{
    const imgElem = await new Promise<HTMLImageElement>((resolve, reject) =>
    {
        const elem = document.createElement("img")
        elem.onload = () => resolve(elem)
        elem.onerror = () => reject()
        elem.src = "data:image/png;base64," + arrayBufferToBase64(rawData)
        document.body.appendChild(elem)
    })

    return imgElem

    /*const w = imgElem.naturalWidth
    const h = imgElem.naturalHeight

    const canvasElem = document.createElement("canvas")
    canvasElem.width = w
    canvasElem.height = h
    document.body.appendChild(canvasElem)
    
    const ctx = canvasElem.getContext("2d")!
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(imgElem, 0, 0)

    const data = ctx.getImageData(0, 0, w, h)
    return data*/
}


function arrayBufferToBase64(buffer: ArrayBuffer)
{
    const bytes = new Uint8Array(buffer)

    let result = ""
    for (let i = 0; i < bytes.byteLength; i++)
        result += String.fromCharCode(bytes[i])

    return window.btoa(result)
}