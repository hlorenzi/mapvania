import * as React from "react"
import styled from "styled-components"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as UI from "../ui"
import { global } from "../global"
import { DefsGeneral } from "./DefsGeneral"
import { DefsLayers } from "./DefsLayers"
import { DefsTilesets } from "./DefsTilesets"
import { DefsTileAttributes } from "./DefsTileAttributes"
import { DefsTileBrushes } from "./DefsTileBrushes"
import { DefsObjects } from "./DefsObjects"
import { useCachedState } from "../util/useCachedState"


export function EditorDefs(props: {
    editorIndex: number,
})
{
    const [tab, setTab] = useCachedState("EditorDefs_TabIndex", 0)


    return <UI.PanelPadding>

        <UI.Grid template="1fr" templateRows="auto 1fr" fullHeight>

            <UI.Cell justifyStart>
                <UI.TabGroup
                    value={ tab }
                    onChange={ setTab }
                    labels={[
                        "General",
                        "Layers",
                        "Tilesets",
                        "Tile Attributes",
                        "Tile Brushes",
                        "Objects",
                ]}/>
            </UI.Cell>

            { tab === 0 &&
                <DefsGeneral
                    editorIndex={ props.editorIndex }
                />
            }

            { tab === 1 &&
                <DefsLayers
                    editorIndex={ props.editorIndex }
                />
            }

            { tab === 2 &&
                <DefsTilesets
                    editorIndex={ props.editorIndex }
                />
            }

            { tab === 3 &&
                <DefsTileAttributes
                    editorIndex={ props.editorIndex }
                />
            }

            { tab === 4 &&
                <DefsTileBrushes
                    editorIndex={ props.editorIndex }
                />
            }

            { tab === 5 &&
                <DefsObjects
                    editorIndex={ props.editorIndex }
                />
            }
            
        </UI.Grid>

    </UI.PanelPadding>
}