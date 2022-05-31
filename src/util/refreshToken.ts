import * as React from "react"


export interface RefreshToken
{
    refreshValue: number
    commit: () => void
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