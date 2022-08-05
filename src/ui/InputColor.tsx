import * as React from "react"
import styled from "styled-components"


const StyledInputColor = styled.input<{
    fullWidth: boolean,
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
    border: 1px solid transparent;
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


export function InputColor(props: {
    id?: string,
    value?: string,
    onChange?: (newValue: string) => void,
    disabled?: boolean,
    fullWidth?: boolean,
    style?: React.CSSProperties,
})
{
    const inputRef = React.useRef<HTMLInputElement>(null)


    const onChange = (ev: any) =>
    {
        const newValue = ev.target.value as string
        
        if (props.onChange)
            props.onChange(newValue)
    }


    let value = props.value
    if (value && value.length > 7)
        value = value.slice(0, 7)


    return <StyledInputColor
        id={ props.id }
        ref={ inputRef }
        type="color"
        value={ value }
        onChange={ onChange }
        disabled={ props.disabled }
        fullWidth={ !!props.fullWidth }
        style={ props.style }
    />
}