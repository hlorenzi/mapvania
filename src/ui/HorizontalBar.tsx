import * as Solid from "solid-js"
import { styled } from "solid-styled-components"


const StyledBar = styled.hr<{
}>`
    border: 0;
    border-bottom: 1px solid #444;
`


export function HorizontalBar(props: {
    style?: Solid.JSX.CSSProperties,
})
{
    return <StyledBar style={ props.style }/>
}