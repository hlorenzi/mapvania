import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import * as Project from "project"
import { PanelPadding } from "../ui/PanelPadding"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { List } from "../ui/List"
import { Grid, Cell } from "../ui/Grid"
import { global, deepAssignProject } from "../global"
import styled from "styled-components"


export function WorldPicker()
{
    const [curWorldId, setCurWorldId] = React.useState<Project.ID>(-1)
    const curWorldIndex = global.project.worlds.findIndex(l => l.id === curWorldId)
    const curWorld = global.project.worlds.find(l => l.id === curWorldId)

    const ctx = Dockable.useContentContext()
    ctx.setTitle(`World Picker`)
    ctx.setPreferredSize(450, 500)


    const createWorld = () =>
    {
        setCurWorldId(global.project.nextId)
        
        deepAssignProject({
            nextId: global.project.nextId + 2,

            worlds: {
                [global.project.worlds.length]: {
                    id: global.project.nextId,
                    name: "world_" + (global.project.worlds.length + 1),
                    stages: [{
                        id: global.project.nextId + 1,
                        name: "stage_1",
        
                        x: 0,
                        y: 0,
                        width: global.project.defs.stageDefaultWidth,
                        height: global.project.defs.stageDefaultHeight,
                    }]
                }
            }
        })
    }


    return <PanelPadding>

        <Grid template="1fr" templateRows="auto 1fr" fullHeight>

            <Cell>
                <Button
                    label="+ World"
                    onClick={ createWorld }
                />
            </Cell>

            <List
                value={ curWorldId }
                onChange={ setCurWorldId }
                items={ global.project.worlds.map(world => ({
                    id: world.id,
                    label: "🗺️ " + world.name,
                }))}
            />

        </Grid>

    </PanelPadding>
}