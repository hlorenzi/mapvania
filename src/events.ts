import * as React from "react"
import * as Editors from "./data/editors"
import { global } from "./global"


function preventDefault(ev: Event)
{
    ev.preventDefault()
}


export function startMouseCapture()
{
    document.addEventListener("contextmenu", preventDefault)
}


export function endMouseCapture()
{
    window.requestAnimationFrame(() =>
    {
        document.removeEventListener("contextmenu", preventDefault)
    })
}


function handleFocusChange(ev: FocusEvent)
{
    Editors.handleExternalFileChanges()
}


export function useWindowFocusEvent()
{
    React.useEffect(() =>
    {
        window.addEventListener("focus", handleFocusChange)

        return () => window.removeEventListener("focus", handleFocusChange)
    
    }, [])
}


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
                        Editors.saveCurrentEditor()
                    }
                    return
            }

            if (document.activeElement &&
                (document.activeElement.tagName === "INPUT" ||
                document.activeElement.tagName === "TEXTAREA"))
                return

            switch (key)
            {
                case "m":
                    global.editors.mapEditing.tool = "move"
                    global.editors.refreshToken.commit()
                    break

                case "b":
                    global.editors.mapEditing.tool = "draw"
                    global.editors.refreshToken.commit()
                    break

                case "g":
                    global.editors.mapEditing.tool = "fill"
                    global.editors.refreshToken.commit()
                    break

                case "r":
                    global.editors.mapEditing.tool = "replace"
                    global.editors.refreshToken.commit()
                    break
                    
                case "e":
                    global.editors.mapEditing.tool = "erase"
                    global.editors.refreshToken.commit()
                    break
                    
                case "shift":
                    if (!global.editors.mapEditing.toolKeyToggled)
                    {
                        global.editors.mapEditing.toolBeforeKeyToggle = global.editors.mapEditing.tool
                        global.editors.mapEditing.toolKeyToggled = true
                    }
                    global.editors.mapEditing.tool = "select"
                    global.editors.refreshToken.commit()
                    break
                    
                case "z":
                    if (ev.ctrlKey)
                    {
                        ev.preventDefault()

                        if (ev.shiftKey)
                            Editors.redo(global.editors.currentEditor)
                        else
                            Editors.undo(global.editors.currentEditor)
                    }
                    break
                    
                case "y":
                    if (ev.ctrlKey)
                    {
                        ev.preventDefault()
                        Editors.redo(global.editors.currentEditor)
                    }
                    break

                case "1":
                    if (global.editors.editors.length > 0)
                        Editors.setCurrentEditor(0)
                    break

                case "2":
                    if (global.editors.editors.length > 1)
                        Editors.setCurrentEditor(1)
                    break

                case "3":
                    if (global.editors.editors.length > 2)
                        Editors.setCurrentEditor(2)
                    break

                case "4":
                    if (global.editors.editors.length > 3)
                        Editors.setCurrentEditor(3)
                    break

                case "5":
                    if (global.editors.editors.length > 4)
                        Editors.setCurrentEditor(4)
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
                    if (global.editors.mapEditing.tool === "select" &&
                        global.editors.mapEditing.toolKeyToggled)
                    {
                        global.editors.mapEditing.tool = global.editors.mapEditing.toolBeforeKeyToggle
                        global.editors.refreshToken.commit()
                    }
                    break
            }

            global.editors.mapEditing.toolKeyToggled = false
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