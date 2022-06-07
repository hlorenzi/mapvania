import * as React from "react"
import styled from "styled-components"


const StyledSelect = styled.select`
    width: 100%;

    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: #242424;
    cursor: pointer;

    box-sizing: border-box;
    border: 1px solid transparent;
    border-radius: 0;
    outline: none;

    padding: 0.25em 0.5em;

    &:hover
    {
        background-color: #2d2d2d;
    }
`


export function Select(props: {
    value?: string,
    onChange?: (newValue: string) => void,
    children?: React.ReactNode,
    disabled?: boolean,
    style?: React.CSSProperties,
})
{
    const onChange = (ev: any) =>
    {
        const newValue = ev.target.value

        if (props.onChange)
            props.onChange(newValue)
    }


	return <StyledSelect
        value={ props.value }
        onChange={ onChange }
        disabled={ props.disabled }
    >
        { props.children }
    </StyledSelect>
}