import * as React from "react"
import * as Actions from "./actions"
import * as Editors from "./data/editors"
import { global } from "./global"


export function useKeyboardShortcuts()
{
    React.useEffect(() =>
    {
        const onKeyDown = (ev: KeyboardEvent) =>
        {
            if (document.activeElement &&
                (document.activeElement.tagName === "INPUT" ||
                document.activeElement.tagName === "TEXTAREA"))
                return

            const key = ev.key.toLowerCase()

            switch (key)
            {
                case "m":
                    global.editors.mapEditing.tileTool = "move"
                    global.editors.refreshToken.commit()
                    break

                case "b":
                    global.editors.mapEditing.tileTool = "draw"
                    global.editors.refreshToken.commit()
                    break

                case "g":
                    global.editors.mapEditing.tileTool = "fill"
                    global.editors.refreshToken.commit()
                    break
                    
                case "e":
                    global.editors.mapEditing.tileTool = "erase"
                    global.editors.refreshToken.commit()
                    break
                    
                case "shift":
                    if (!global.editors.mapEditing.tileToolKeyToggled)
                    {
                        global.editors.mapEditing.tileToolBeforeKeyToggle = global.editors.mapEditing.tileTool
                        global.editors.mapEditing.tileToolKeyToggled = true
                    }
                    global.editors.mapEditing.tileTool = "select"
                    global.editors.refreshToken.commit()
                    break
                    
                case "s":
                    if (ev.ctrlKey)
                    {
                        ev.preventDefault()
                        Actions.save.func()
                    }
                    break
                    
                case "z":
                    if (ev.ctrlKey)
                    {
                        if (ev.shiftKey)
                            Editors.redo(global.editors.currentEditor)
                        else
                            Editors.undo(global.editors.currentEditor)
                    }
                    break
                    
                case "y":
                    if (ev.ctrlKey)
                        Editors.redo(global.editors.currentEditor)
                    break
            }
        }


        const onKeyUp = (ev: KeyboardEvent) =>
        {
            if (document.activeElement &&
                (document.activeElement.tagName === "INPUT" ||
                document.activeElement.tagName === "TEXTAREA"))
                return
            
            const key = ev.key.toLowerCase()

            switch (key)
            {
                case "shift":
                    if (global.editors.mapEditing.tileTool === "select" &&
                        global.editors.mapEditing.tileToolKeyToggled)
                    {
                        global.editors.mapEditing.tileTool = global.editors.mapEditing.tileToolBeforeKeyToggle
                        global.editors.refreshToken.commit()
                    }
                    break
            }

            global.editors.mapEditing.tileToolKeyToggled = false
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