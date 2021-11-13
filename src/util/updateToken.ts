import * as React from "react"


export interface UpdateToken
{
    updateToken: number
    commit: () => void
}


export function useUpdateToken(): UpdateToken
{
    const [updateToken, setUpdateToken] = React.useState(0)

    return {
        updateToken,
        commit: () => setUpdateToken(n => (n + 1) % 1000000)
    }
}