import * as React from "react"


export interface UpdateToken
{
    updateToken: number
    commit: () => void
}


export function useUpdateToken(windowEventName: string): UpdateToken
{
    const [updateToken, setUpdateToken] = React.useState(0)

    return {
        updateToken,
        commit: () =>
        {
            setUpdateToken(n => (n + 1) % 1000000)
            window.dispatchEvent(new Event(windowEventName))
        }
    }
}