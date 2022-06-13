export function snapRound(x: number, step: number): number
{
    return Math.round(x / step) * step
}


export function snap(x: number, step: number): number
{
    return Math.floor(x / step) * step
}


export interface Point
{
    x: number
    y: number
}


export function pointDistance(a: Point, b: Point)
{
    const xx = a.x - b.x
    const yy = a.y - b.y
    return Math.sqrt(xx * xx + yy * yy)
}


export function dotProduct(a: Point, b: Point)
{
    return a.x * b.x + a.y * b.y
}


export interface RectWH
{
    x: number
    y: number
    width: number
    height: number
}


export function rectCenteredContains(rect: RectWH, point: Point)
{
    return (point.x >= rect.x - rect.width / 2 &&
        point.x <= rect.x + rect.width / 2 &&
        point.y >= rect.y - rect.height / 2 &&
        point.y <= rect.y + rect.height / 2)
}


export function rectContains(rect: RectWH, point: Point)
{
    return (point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height)
}