import * as React from "react"
import styled from "styled-components"


const StyledPanelPadding = styled.div<{
    noOverflow: boolean,
}>`
    width: 100%;
    height: 100%;
    padding: 0.5em;
    overflow-x: hidden;
    overflow-y: ${ props => props.noOverflow ? "hidden" : "auto" };
`


export function PanelPadding(props: {
    children?: React.ReactNode,
    noOverflow?: boolean,
})
{
    return <StyledPanelPadding
        noOverflow={ !!props.noOverflow }
    >
        { props.children }
    </StyledPanelPadding>
}