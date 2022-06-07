export function snap(x: number, step: number): number
{
    return Math.round(x / step) * step
}


export interface Point
{
    x: number
    y: number
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