import * as React from "react"
import styled from "styled-components"


const StyledBar = styled.hr<{
}>`
    border: 0;
    border-bottom: 1px solid #444;
`


export function HorizontalBar(props: {
    style?: React.CSSProperties,
})
{
    return <StyledBar style={ props.style }/>
}