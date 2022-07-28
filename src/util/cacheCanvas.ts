import * as Cache from "./cache"


export class CacheCanvas
{
    cache = new Cache.Cache<string, HTMLCanvasElement>()


    get(
        key: string,
        width: number,
        height: number,
        render: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement
    {
        const value = this.cache.get(key)
        if (value === undefined ||
            value.width !== width ||
            value.height !== height)
        {
            const canvas = document.createElement("canvas")
            canvas.style.display = "none"
            canvas.width = width
            canvas.height = height
            document.body.appendChild(canvas)

            this.cache.set(key, canvas)

            const ctx = canvas.getContext("2d")
            if (ctx)
                render(canvas, ctx)

            return canvas
        }
        
        return value
    }


    advanceTimer(deleteIfOlderThan: number)
    {
        for (const canvas of this.cache.advanceTimer(deleteIfOlderThan))
            document.body.removeChild(canvas)
    }


    clear()
    {
        for (const canvas of this.cache.items.values())
            document.body.removeChild(canvas.value)

        this.cache.items.clear()
    }
}