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
    const [refresh, setRefresh] = React.useState(0)

    return React.useMemo<RefreshToken>(() =>
    {
        const token: RefreshToken = {
            refreshValue: 0,
            commit: () =>
            {
                //console.log("refreshToken", windowEventName, "commit", token.refreshValue)
                token.refreshValue = (token.refreshValue + 1) % 1000000
                setRefresh(token.refreshValue)
                window.dispatchEvent(new Event(windowEventName))
            },
            useRefresh: () => useRefreshByEvent(windowEventName),
        }

        return token

    }, [])
}