import * as React from "react"
import * as Project from "./project"
import { UpdateToken } from "./util/updateToken"
import { deepAssign, DeepAssignable } from "./util/deepAssign"


export interface Global
{
    projectToken: UpdateToken
    project: Project.Project

    editingToken: UpdateToken
    editingLayerId: Project.ID
    editingTilesetId: Project.ID
    editingTilesetStampSet: Set<number>
    editingTileStamp: Project.TileField

    images: { [id: Project.ID]: HTMLImageElement }
}


export const global: Global =
{
    projectToken: null!,
    project: null!,

    editingToken: null!,
    editingLayerId: -1,
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