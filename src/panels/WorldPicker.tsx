import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import { PanelPadding } from "../ui/PanelPadding"
import { Input } from "../ui/Input"
import { Grid, Cell } from "../ui/Grid"
import styled from "styled-components"


export function WorldPicker()
{
    const ctx = Dockable.useContentContext()
    ctx.setTitle(`World Picker`)
    ctx.setPreferredSize(450, 500)


    return <PanelPadding>
        <Grid cols={ 2 }>

            <Cell span={ 1 } justifyEnd>
                Stage Default Dimensions W
            </Cell>

            <Cell><Input/></Cell>

            <Cell span={ 1 } justifyEnd>
                Stage Default Dimensions H
            </Cell>

            <Cell><Input/></Cell>

        </Grid>
    </PanelPadding>
}