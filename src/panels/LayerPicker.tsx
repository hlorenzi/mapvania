import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import * as Project from "project"
import { PanelPadding } from "../ui/PanelPadding"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { List } from "../ui/List"
import { Grid, Cell } from "../ui/Grid"
import { global, LAYER_ID_WORLD } from "../global"
import styled from "styled-components"


export function LayerPicker()
{
    const ctx = Dockable.useContentContext()
    ctx.setTitle(`Layer Picker`)
    ctx.setPreferredSize(450, 500)


    const chooseLayer = (id: Project.ID) =>
    {
        global.editingLayerId = id
        global.editingToken.commit()
    }


    const getLayerIcon = (layerDef: Project.DefLayer) =>
    {
        return layerDef.type == "tile" ? "🧱" :
            layerDef.type == "object" ? "🍎" :
            ""
    }


    const layerItems = [
        {
            id: LAYER_ID_WORLD,
            label: "🗺️ World",
        },
        ...global.project.defs.layerDefs.map(layerDef => ({
            id: layerDef.id,
            label: getLayerIcon(layerDef) + " " + layerDef.name,
        }))
    ]


    return <PanelPadding>

        <Grid template="1fr" templateRows="1fr" fullHeight>

            <List
                value={ global.editingLayerId }
                onChange={ chooseLayer }
                items={ layerItems }
            />

        </Grid>

    </PanelPadding>
}