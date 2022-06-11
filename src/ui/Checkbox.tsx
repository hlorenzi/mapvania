import * as React from "react"
import styled from "styled-components"


const StyledCheckbox = styled.input<{
}>`
    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: transparent;

    box-sizing: border-box;
    border: 0;
    outline: none;
    cursor: pointer;
    text-align: center;

    padding: 0.25em 0.25em;
    margin: 0;

    &:hover
    {
        background-color: #2d2d2d;
    }
`


const LabelCheckbox = styled.label`
    user-select: none;
    padding-left: 0.25em;
    padding-right: 0.25em;
    cursor: pointer;
    color: inherit;
`


let checkboxId = 1


export function Checkbox(props: {
    label?: React.ReactNode,
    children?: React.ReactNode,
    labelBefore?: boolean,
    value?: boolean,
    onChange?: (value: boolean) => void,
    onMouseDown?: React.MouseEventHandler<HTMLInputElement>,
    disabled?: boolean,
    style?: React.CSSProperties,
})
{
    const [labelId,] = React.useState(() => { return (checkboxId++).toString() })

    const value = props.value

    const onChange = (ev: React.ChangeEvent<HTMLInputElement>) =>
    {
        const newValue = ev.target.checked
        //console.log("onChange", newValue)

        if (props.onChange)
            props.onChange(newValue)
    }


    const label = props.children || props.label


	return <>
        { !label || !props.labelBefore ? null :
            <LabelCheckbox
                htmlFor={ labelId }
            >
                { label }
            </LabelCheckbox>
        }
        
        <StyledCheckbox
            id={ labelId }
            type="checkbox"
            checked={ value }
            onChange={ onChange }
            disabled={ props.disabled }
        />

        { !label ? null :
            <LabelCheckbox
                htmlFor={ labelId }
            >
                { label }
            </LabelCheckbox>
        }
	</>
}