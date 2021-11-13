import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import { PanelPadding } from "../ui/PanelPadding"
import { Input } from "../ui/Input"
import { TabGroup } from "../ui/TabGroup"
import { Grid, Cell } from "../ui/Grid"
import { List } from "../ui/List"
import { global, deepAssignProject } from "../global"
import { deepAssign } from "../util/deepAssign"
import styled from "styled-components"
import * as Project from "project"


export function GlobalDefs()
{
    const ctx = Dockable.useContentContext()
    ctx.setTitle(`Global Definitions`)
    ctx.setPreferredSize(450, 500)


    const [tab, setTab] = React.useState(0)


    return <PanelPadding>

        <Grid template="1fr" templateRows="auto 1fr" fullHeight>

            <Cell justifyCenter>
                <TabGroup
                    value={ tab }
                    onChange={ setTab }
                    labels={[
                        "General",
                        "Layers",
                ]}/>
            </Cell>

            { tab == 0 && <GeneralDefs/> }
            { tab == 1 && <LayerDefs/> }

        </Grid>

    </PanelPadding>
}


export function GeneralDefs()
{
    return <Grid template="auto auto">

        <Cell span={ 2 } justifyCenter>
            Stage
        </Cell>

        <Cell justifyEnd>
            Default Size
        </Cell>

        <Cell>
            <Grid template="1fr auto 1fr auto">
                <Cell>
                    <Input
                        number
                        value={ global.project.defs.stageDefaultWidth }
                        onChangeNumber={ (value) => deepAssignProject({ defs: { stageDefaultWidth: value } }) }
                    />
                </Cell>
                <Cell>px × </Cell>
                <Cell>
                    <Input
                        value={ global.project.defs.stageDefaultHeight }
                        onChangeNumber={ (value) => deepAssignProject({ defs: { stageDefaultHeight: value } }) }
                    />
                </Cell>
                <Cell>px</Cell>
            </Grid>
        </Cell>

    </Grid>
}


export function LayerDefs()
{
    const [curLayer, setCurLayer] = React.useState("")


    const createLayer = (layerDef: Project.DefLayer) =>
    {
        deepAssignProject({ defs: { layerDefs: { [global.project.defs.layerDefs.length]: layerDef }}})
    }


    const createTileLayer = () =>
    {
        const layerDef: Project.DefLayerTile =
        {
            type: "tile",
            id: "layer_" + global.project.defs.layerDefs.length,
            gridCellWidth: 16,
            gridCellHeight: 16,
        }

        createLayer(layerDef)
        setCurLayer(layerDef.id)
    }


    const createObjectLayer = () =>
    {
        const layerDef: Project.DefLayerObject =
        {
            type: "object",
            id: "layer_" + global.project.defs.layerDefs.length,
            gridCellWidth: 16,
            gridCellHeight: 16,
        }

        createLayer(layerDef)
        setCurLayer(layerDef.id)
    }


    const getLayerLabel = (layerDef: Project.DefLayer) =>
    {
        const icon =
            layerDef.type == "tile" ? "🧱 " :
            layerDef.type == "object" ? "🍎 " :
            ""
        
        return icon + layerDef.id
    }


    return <Grid template="1fr 1fr" templateRows="auto 1fr" fullHeight>

        <Cell>
            <button
                onClick={ createTileLayer }
            >
                + Tile Layer
            </button>

            <button
                onClick={ createObjectLayer }
            >
                + Object Layer
            </button>
        </Cell>

        <Cell/>

        <List
            value={ curLayer }
            onChange={ setCurLayer }
            items={ global.project.defs.layerDefs.map(layerDef => ({
                id: layerDef.id,
                label: getLayerLabel(layerDef),
            }))}
        />

    </Grid>
}