import * as React from "react"
import styled from "styled-components"


const StyledButton = styled.button<{
    fullWidth: boolean,
    selected: boolean,
}>`
    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: transparent;

    justify-self: stretch;

    ${ props => props.fullWidth ? "width: 100%;" : "" }
    min-width: 2em;
    
    background-color: transparent;
    box-sizing: border-box;
    border: 0;
    outline: none;
    border-radius: 0.25em;
    cursor: pointer;
    text-align: center;

    padding: 0.25em 0.5em;

    &:hover
    {
        background-color: #2d2d2d;
    }
`


export function Button(props: {
    label?: React.ReactNode,
    children?: React.ReactNode,
    onClick?: React.MouseEventHandler<HTMLButtonElement>,
    onMouseDown?: React.MouseEventHandler<HTMLButtonElement>,
    disabled?: boolean,
    selected?: boolean,
    fullWidth?: boolean,
    style?: React.CSSProperties,
})
{
    return <StyledButton
        onClick={ props.onClick }
        onMouseDown={ props.onMouseDown }
        disabled={ props.disabled }
        selected={ !!props.selected }
        fullWidth={ !!props.fullWidth }
        style={ props.style }
    >
        { props.children ?? props.label }
    </StyledButton>
}