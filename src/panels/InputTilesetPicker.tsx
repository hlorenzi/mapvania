import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as ID from "../data/id"
import * as Images from "../data/images"
import * as UI from "../ui"
import { ModalTilesetPicker } from "./ModalTilesetPicker"


export function InputTilesetPicker(props: {
    defs: Defs.Defs,
    value: ID.ID,
    onChange?: (newValue: ID.ID) => void,
    basePath: string,
    header?: string,
    placeholder?: string,
})
{
    const [open, setOpen] = React.useState(false)


    const tileset = Defs.getTileset(props.defs, props.value)


    return <div style={{
        display: "grid",
        gridTemplate: "3em / 3fr auto 1fr",
        gap: "0.5em",
        alignItems: "center",
    }}>
        
        <UI.Button
            title="Click to choose..."
            onClick={ () => setOpen(true) }
            backgroundColor="#111111"
            style={{
                width: "100%",
                height: "3em",
                overflow: "hidden",
        }}>
            <div style={{
                width: "100%",
                height: "100%",
                display: "grid",
                overflow: "hidden",
                gridTemplate: "1fr / 3em 1fr",
                alignItems: "center",
                justifyItems: "start",
                gap: "0.5em",
            }}>
                <div style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    overflow: "hidden",
                    justifySelf: "center",
                }}>
                    { tileset && Defs.getTilesetDefIconElement(props.basePath, tileset) }
                </div>

                <div>
                    { tileset?.name ??
                        <span style={{
                            fontStyle: "italic",
                            opacity: 0.75,
                        }}>
                            Choose tileset...
                        </span>
                    }
                </div>
            </div>
        </UI.Button>

        <div>ID:</div>

        <UI.Input
            valueSignal={ props.value }
            onChange={ props.onChange }
            fullWidth
        />
        
        <ModalTilesetPicker
            open={ open }
            setOpen={ setOpen }
            header={ props.header }
            defs={ props.defs }
            value={ props.value }
            onChange={ props.onChange }
            basePath={ props.basePath }
        />
    </div>
}