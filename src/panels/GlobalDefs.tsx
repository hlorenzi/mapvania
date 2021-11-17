import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import { LayerDefs } from "./LayerDefs"
import { TilesetDefs } from "./TilesetDefs"
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
                        "Tilesets",
                ]}/>
            </Cell>

            { tab == 0 && <GeneralDefs/> }
            { tab == 1 && <LayerDefs/> }
            { tab == 2 && <TilesetDefs/> }

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