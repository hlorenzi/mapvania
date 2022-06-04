import * as React from "react"
import * as Actions from "./actions"


export function useKeyboardShortcuts()
{
    React.useEffect(() =>
    {
        const onKeyDown = (ev: KeyboardEvent) =>
        {
            const key = ev.key.toLowerCase()

            switch (key)
            {
                case "s":
                    if (ev.ctrlKey)
                    {
                        ev.preventDefault()
                        Actions.save.func()
                    }
                    break
            }
        }


        const onKeyUp = (ev: KeyboardEvent) =>
        {
            const key = ev.key.toLowerCase()
        }


        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)

        return () =>
        {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
        }

    }, [])
}