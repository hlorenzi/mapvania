import * as React from "react"


const cache = new Map<string, any>()


export function useCachedState<T>(
    key: string,
    initialState: T | (() => T))
    : [T, React.Dispatch<React.SetStateAction<T>>]
{
    const [value, setState] = React.useState<T>(
        cache.has(key) ?
            cache.get(key) :
            initialState)

    const newSetState: React.Dispatch<React.SetStateAction<T>> = (newValue: T | ((prevState: T) => T)) =>
    {
        const finalValue: T =
            typeof newValue === "function" ?
                (newValue as any)(value) :
                newValue

        cache.set(key, finalValue)
        setState(finalValue)
    }

    return [value, newSetState]
}