import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as ID from "../data/id"
import * as UI from "../ui"
import { global } from "../global"


export function HeaderAndBody(props: {
    header?: React.ReactNode,
    children: React.ReactNode,
})
{
    return <StyledRoot>

        { !props.header ?
            <div/>
        :
            <StyledHeader>
                { props.header }
            </StyledHeader>
        }

        { props.children }

    </StyledRoot>
}


const StyledRoot = styled.div`
    width: 100%;
    height: 100%;

    display: grid;
    grid-template: auto 1fr / 1fr;
`


const StyledHeader = styled.div`
    width: 100%;

    background-color: #242424;
    padding: 0.5em 1em;

    user-select: none;
`