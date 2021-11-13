import * as React from "react"
import styled from "styled-components"


const StyledPanelPadding = styled.div`
    width: 100%;
    height: 100%;
    padding: 0.25em;
    overflow-x: hidden;
    overflow-y: auto;
`


export function PanelPadding(props: {
    children?: React.ReactNode,
})
{
    return <StyledPanelPadding>
        { props.children }
    </StyledPanelPadding>
}