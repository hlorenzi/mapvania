import * as Hierarchy from "../data/hierarchy"
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


export interface BuiltinImageItem extends Hierarchy.Item
{
    name: string
}


export const builtinTilesetImages: BuiltinImageItem[] =
[
    { name: "basic", id: "tileset/basic.png" },
    { name: "basic_color", id: "tileset/basic_color.png" },
    { name: "example_forest", id: "tileset/example_forest.png" },
]


export const builtinObjectImages: BuiltinImageItem[] =
[
    { name: "blank", id: "obj/blank.png" },
    { name: "circle", id: "obj/circle.png" },
    { name: "square", id: "obj/square.png" },
    { name: "diamond", id: "obj/diamond.png" },
    { name: "dot", id: "obj/dot.png" },

    { name: "plus", id: "obj/plus.png" },
    { name: "triangleU", id: "obj/triangleU.png" },
    { name: "triangleR", id: "obj/triangleR.png" },
    { name: "triangleD", id: "obj/triangleD.png" },
    { name: "triangleL", id: "obj/triangleL.png" },

    { name: "minus", id: "obj/minus.png" },
    { name: "arrowU", id: "obj/arrowU.png" },
    { name: "arrowR", id: "obj/arrowR.png" },
    { name: "arrowD", id: "obj/arrowD.png" },
    { name: "arrowL", id: "obj/arrowL.png" },
    
    { name: "xmark", id: "obj/xmark.png" },
    { name: "corners", id: "obj/corners.png" },
    { name: "crosshairs", id: "obj/crosshairs.png" },
    { name: "swirl", id: "obj/swirl.png" },
    { name: "sparkle", id: "obj/sparkle.png" },

    { name: "coin", id: "obj/coin.png" },
    { name: "gem", id: "obj/gem.png" },
    { name: "crown", id: "obj/crown.png" },
    { name: "heart", id: "obj/heart.png" },
    { name: "star", id: "obj/star.png" },

    { name: "smiley", id: "obj/smiley.png" },
    { name: "baddie", id: "obj/baddie.png" },
    { name: "skull", id: "obj/skull.png" },
    { name: "shock", id: "obj/shock.png" },
    { name: "fire", id: "obj/fire.png" },

    { name: "key", id: "obj/key.png" },
    { name: "keyhole", id: "obj/keyhole.png" },
    { name: "flag", id: "obj/flag.png" },
    { name: "exclamation", id: "obj/exclamation.png" },
    { name: "question", id: "obj/question.png" },

    { name: "1", id: "obj/1.png" },
    { name: "2", id: "obj/2.png" },
    { name: "3", id: "obj/3.png" },
    { name: "4", id: "obj/4.png" },
    { name: "e", id: "obj/e.png" },
    
    { name: "block", id: "obj/block.png" },
    { name: "chest", id: "obj/chest.png" },
    { name: "leverR", id: "obj/leverR.png" },
    { name: "leverL", id: "obj/leverL.png" },
]


export const standardTintColors: string[] = [
    "#ffffff", // white
    "#3f6cf5", // blue
    "#e93f3f", // red
    "#e9cf3f", // yellow
    "#4fa328", // green
    "#d750e9", // pink
    "#8236f4", // purple
    "#f4790c", // orange
    "#44f5fe", // cyan
    "#828282", // gray
    "#000000", // black
]


export const standardBkgColors: string[] = [
    "#00000000", // transparent
    "#bbbbbb", // white
    "#303030", // gray
    "#000000", // black
]


export interface Color
{
    r: number
    g: number
    b: number
    a: number
}


export interface BuiltinImageOptions
{
    id: string
    color: Color
    bkgColor: Color
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


export function encodeBuiltinImagePath(
    opts: BuiltinImageOptions)
    : string
{
    console.log("encode", opts, colorRgbToHex(opts.color), colorRgbToHex(opts.bkgColor))

    return Filesystem.BUILTIN_IMAGE_PREFIX +
        opts.id + Filesystem.BUILTIN_IMAGE_SEPARATOR +
        colorRgbToHex(opts.color) + Filesystem.BUILTIN_IMAGE_SEPARATOR +
        colorRgbToHex(opts.bkgColor)
}


export function decodeBuiltinImagePath(
    path: string)
    : BuiltinImageOptions | null
{
    if (!path.startsWith(Filesystem.BUILTIN_IMAGE_PREFIX))
        return null
    
    const split = path
        .substring(Filesystem.BUILTIN_IMAGE_PREFIX.length)
        .split(Filesystem.BUILTIN_IMAGE_SEPARATOR)

    if (split.length === 1)
    {
        return {
            id: split[0],
            color: { r: 255, g: 255, b: 255, a: 255 },
            bkgColor: { r: 0, g: 0, b: 0, a: 0 },
        }
    }

    if (split.length < 3)
        return null

    const id = split[0]
    const color = colorHexToRgb(split[1])
    const bkgColor = colorHexToRgb(split[2])

    return {
        id,
        color,
        bkgColor,
    }
}


export function colorHexToRgb(hex: string)
{
    if (hex.length < 6)
        return { r: 0, g: 0, b: 0, a: 0 }
    
    let start = 0

    if (hex[0] === "#")
        start = 1

    if (hex.length - start < 6)
        return { r: 0, g: 0, b: 0, a: 0 }
    
    return {
        r: parseInt(hex.substring(start + 0, start + 2), 16),
        g: parseInt(hex.substring(start + 2, start + 4), 16),
        b: parseInt(hex.substring(start + 4, start + 6), 16),
        a: hex.length - start >= 8 ?
            parseInt(hex.substring(start + 6, start + 8), 16) :
            255,
    }
}


export function colorRgbToHex(color: Color)
{
    const rgb =
        (color.r << 16) |
        (color.g << 8) |
        (color.b << 0)

    return "#" +
        rgb.toString(16).padStart(6, "0") +
        color.a.toString(16).padStart(2, "0")
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
        let element: HTMLImageElement

        if (rootRelativePath.startsWith(Filesystem.BUILTIN_IMAGE_PREFIX))
        {
            const opts = decodeBuiltinImagePath(rootRelativePath)!
            const entry = await fetch("assets/" + opts.id)
            const bytes = await entry.arrayBuffer()
            const elementOriginal = await getImageElementFromBytes(
                rootRelativePath,
                bytes)

            element = await tintImageElement(
                elementOriginal,
                opts.color,
                opts.bkgColor)
        }
        else
        {
            const entry = await Filesystem.findFile(rootRelativePath)
            const file = await entry.handle.getFile()
            const bytes = await file.arrayBuffer()
            element = await getImageElementFromBytes(
                rootRelativePath,
                bytes)
        }

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


export async function tintImageElement(
    element: HTMLImageElement,
    color: Color,
    bkgColor: Color)
    : Promise<HTMLImageElement>
{
    const canvas = document.createElement("canvas")
    canvas.width = element.width
    canvas.height = element.height

    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(element, 0, 0)

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let p = 0; p < pixels.data.length; p += 4)
    {
        if (pixels.data[p + 3] > 0)
        {
            pixels.data[p + 0] = Math.floor(
                (pixels.data[p + 0] / 255) * (color.r / 255) * 255)

            pixels.data[p + 1] = Math.floor(
                (pixels.data[p + 1] / 255) * (color.g / 255) * 255)

            pixels.data[p + 2] = Math.floor(
                (pixels.data[p + 2] / 255) * (color.b / 255) * 255)
        }
        else
        {
            pixels.data[p + 0] = bkgColor.r
            pixels.data[p + 1] = bkgColor.g
            pixels.data[p + 2] = bkgColor.b
            pixels.data[p + 3] = bkgColor.a
        }
    }
        
    ctx.putImageData(pixels, 0, 0)
    
    element.src = canvas.toDataURL("image/png")
    return element
}


function arrayBufferToBase64(buffer: ArrayBuffer)
{
    const bytes = new Uint8Array(buffer)

    let result = ""
    for (let i = 0; i < bytes.byteLength; i++)
        result += String.fromCharCode(bytes[i])

    return window.btoa(result)
}