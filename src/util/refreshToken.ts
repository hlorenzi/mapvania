import * as React from "react"


export interface RefreshToken
{
    refreshValue: number
    commit: () => void
    useRefresh: () => void
}


export function useRefreshByEvent(eventName: string)
{
    const [refresh, setRefresh] = React.useState(0)

    React.useEffect(() =>
    {
        const fn = () =>
        {
            //console.log("useRefreshByEvent", eventName)
            setRefresh(n => (n + 1) % 1000000)
        }

        window.addEventListener(eventName, fn)
        return () => window.removeEventListener(eventName, fn)

    }, [])

    return refresh
}


export function useRefreshToken(windowEventName: string): RefreshToken
{
    const [refreshValue, setRefreshValue] = React.useState(0)

    return React.useMemo<RefreshToken>(() => ({
        refreshValue,
        commit: () =>
        {
            setRefreshValue(n =>
            {
                //console.log("refreshToken", windowEventName, "commit", n)
                return (n + 1) % 1000000
            })
            window.dispatchEvent(new Event(windowEventName))
        },
        useRefresh: () => useRefreshByEvent(windowEventName),

    }), [refreshValue])
}