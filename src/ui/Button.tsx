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
    min-width: 1em;
    
    background-color: transparent;
    box-sizing: border-box;
    border: ${ props => props.selected ? "1px solid #ffffff" : "1px solid transparent" };
    outline: none;
    border-radius: 0.25em;
    cursor: pointer;
    text-align: center;

    padding: 0.25em 0.25em;

    &:hover
    {
        background-color: #2d2d2d;
    }
`


export function Button(props: {
    label?: React.ReactNode,
    title?: string,
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
        title={ props.title }
        disabled={ props.disabled }
        selected={ !!props.selected }
        fullWidth={ !!props.fullWidth }
        style={ props.style }
    >
        { props.children ?? props.label }
    </StyledButton>
}