import * as React from "react"


export interface RefreshToken
{
    refreshValue: number
    commit: () => void
}


export function useRefreshByEvent(eventName: string)
{
    const [refresh, setRefresh] = React.useState(0)

    React.useEffect(() =>
    {
        const fn = () => setRefresh(r => r + 1)
        window.addEventListener(eventName, fn)
        return window.removeEventListener(eventName, fn)

    }, [])

    return refresh
}


export function useRefreshToken(windowEventName: string): RefreshToken
{
    const [refreshValue, setRefreshValue] = React.useState(0)

    return {
        refreshValue,
        commit: () =>
        {
            setRefreshValue(n => (n + 1) % 1000000)
            window.dispatchEvent(new Event(windowEventName))
        }
    }
}