import { RefreshToken } from "../util/refreshToken"
import { global } from "../global"
import * as Filesystem from "./filesystem"


export const IMAGE_ELEM_ID_PREFIX = "image_"


export interface Global
{
    refreshToken: RefreshToken
    images: {
        [path: string]: Image | null
    }
}


export interface Image
{
    width: number
    height: number
    element: HTMLImageElement
}


export function makeNew(refreshToken: RefreshToken): Global
{
    return {
        refreshToken,
        images: {},
    }
}


export function invalidateImages()
{
    for (const path of Object.keys(global.images.images))
    {
        const elem = document.getElementById(IMAGE_ELEM_ID_PREFIX + path)
        if (elem)
            document.body.removeChild(elem)
    }

    global.images.images = {}
    global.images.refreshToken.commit()
}


export function getImageLazy(rootRelativePath: string): Image | undefined
{
    if (!rootRelativePath)
        return undefined
    
    const cachedImage = global.images.images[rootRelativePath]
    if (cachedImage)
        return cachedImage
    
    loadImage(rootRelativePath)
    return undefined
}


const imagesLoading = new Set<string>()


export async function loadImage(rootRelativePath: string): Promise<Image | null>
{
    if (global.images.images[rootRelativePath] !== undefined)
        return global.images.images[rootRelativePath]
    
    if (imagesLoading.has(rootRelativePath))
    {
        while (true)
        {
            await new Promise((resolve, reject) =>
                window.setTimeout(resolve, 250))

            if (global.images.images[rootRelativePath] !== undefined)
                return global.images.images[rootRelativePath]
        }
    }

    imagesLoading.add(rootRelativePath)

    try
    {
        const entry = await Filesystem.findFile(rootRelativePath)
        const file = await entry.handle.getFile()
        const bytes = await file.arrayBuffer()
        const element = await getImageElementFromBytes(rootRelativePath, bytes)

        global.images.images[rootRelativePath] = {
            width: element.width,
            height: element.height,
            element,
        }
    }
    catch (e)
    {
        global.images.images[rootRelativePath] = null
    }

    imagesLoading.delete(rootRelativePath)

    global.images.refreshToken.commit()
    return global.images.images[rootRelativePath]
}


export async function getImageElementFromBytes(
    id: string,
    rawData: ArrayBuffer)
    : Promise<HTMLImageElement>
{
    const imgElem = await new Promise<HTMLImageElement>((resolve, reject) =>
    {
        const elem = document.createElement("img")
        elem.id = IMAGE_ELEM_ID_PREFIX + id
        elem.onload = () => resolve(elem)
        elem.onerror = () => reject()
        elem.src = "data:image/png;base64," + arrayBufferToBase64(rawData)
        document.body.appendChild(elem)
    })

    return imgElem
}


function arrayBufferToBase64(buffer: ArrayBuffer)
{
    const bytes = new Uint8Array(buffer)

    let result = ""
    for (let i = 0; i < bytes.byteLength; i++)
        result += String.fromCharCode(bytes[i])

    return window.btoa(result)
}