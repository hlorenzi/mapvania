import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import { PanelPadding } from "../ui/PanelPadding"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { TabGroup } from "../ui/TabGroup"
import { Grid, Cell } from "../ui/Grid"
import { List } from "../ui/List"
import { global, deepAssignProject } from "../global"
import { deepAssign, DeepAssignable } from "../util/deepAssign"
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

        <Cell justifyEnd>
            Default Stage Size
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
                <Cell> × </Cell>
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
    const [curLayerId, setCurLayerId] = React.useState<Project.ID>(-1)
    const curLayerIndex = global.project.defs.layerDefs.findIndex(l => l.id === curLayerId)
    const curLayer = global.project.defs.layerDefs.find(l => l.id === curLayerId)


    const deepAssignLayer = (layerDef: DeepAssignable<Project.DefLayer>) =>
    {
        if (curLayerIndex < 0)
            return

        deepAssignProject({ defs: { layerDefs: { [curLayerIndex]: layerDef }}})
    }


    const createLayer = (layerDef: Project.DefLayer) =>
    {
        deepAssignProject(
        {
            nextId: layerDef.id + 1,
            defs: { layerDefs: { [global.project.defs.layerDefs.length]: layerDef }},
        })
    }


    const createTileLayer = () =>
    {
        const layerDef: Project.DefLayerTile =
        {
            type: "tile",
            id: global.project.nextId,
            name: "layer_" + (global.project.defs.layerDefs.length + 1),
            gridCellWidth: 16,
            gridCellHeight: 16,
        }

        createLayer(layerDef)
        setCurLayerId(layerDef.id)
    }


    const createObjectLayer = () =>
    {
        const layerDef: Project.DefLayerObject =
        {
            type: "object",
            id: global.project.nextId,
            name: "layer_" + (global.project.defs.layerDefs.length + 1),
            gridCellWidth: 16,
            gridCellHeight: 16,
        }

        createLayer(layerDef)
        setCurLayerId(layerDef.id)
    }


    const deleteCurLayer = () =>
    {
        deepAssignProject(
        {
            defs: { layerDefs: global.project.defs.layerDefs.filter(l => l.id !== curLayerId) },
        })
    }


    const getLayerIcon = (layerDef: Project.DefLayer) =>
    {
        return layerDef.type == "tile" ? "🧱" :
            layerDef.type == "object" ? "🍎" :
            ""
    }


    const getLayerType = (layerDef: Project.DefLayer) =>
    {
        return layerDef.type == "tile" ? "Tile Layer" :
            layerDef.type == "object" ? "Object Layer" :
            ""
    }


    return <Grid template="1fr 2fr" templateRows="auto 1fr" maxWidth="45em" fullHeight>

        <Cell>
            <Button
                label="+ Tile Layer"
                onClick={ createTileLayer }
            />

            <Button
                label="+ Object Layer"
                onClick={ createObjectLayer }
            />
        </Cell>

        <Cell/>

        <List
            value={ curLayerId }
            onChange={ setCurLayerId }
            items={ global.project.defs.layerDefs.map(layerDef => ({
                id: layerDef.id,
                label: getLayerIcon(layerDef) + " " + layerDef.name,
            }))}
        />

        { curLayer && <Grid template="auto auto" key={ curLayer.id }>

            <Cell span={ 2 } justifyEnd>
                <Button
                    label="Delete"
                    onClick={ deleteCurLayer }
                />
            </Cell>

            <Cell span={ 2 } justifyCenter>
                { getLayerIcon(curLayer) + " " + getLayerType(curLayer) }
            </Cell>

            <Cell span={ 2 } divider/>

            <Cell justifyEnd>
                Unique Name
            </Cell>

            <Cell justifyStretch>
                <Input
                    value={ curLayer.name }
                    onChange={ (value) => deepAssignLayer({ name: value }) }
                    fullWidth
                />
            </Cell>
            
            <Cell justifyEnd>
                Grid Size
            </Cell>

            <Cell>
                <Grid template="1fr auto 1fr auto">
                    <Cell>
                        <Input
                            number
                            value={ curLayer.gridCellWidth }
                            onChangeNumber={ (value) => deepAssignLayer({ gridCellWidth: value }) }
                        />
                    </Cell>
                    <Cell> × </Cell>
                    <Cell>
                        <Input
                            number
                            value={ curLayer.gridCellHeight }
                            onChangeNumber={ (value) => deepAssignLayer({ gridCellHeight: value }) }
                        />
                    </Cell>
                    <Cell>px</Cell>
                </Grid>
            </Cell>

        </Grid> }

    </Grid>
}