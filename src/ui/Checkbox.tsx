import * as Solid from "solid-js"
import { styled } from "solid-styled-components"


const StyledCheckbox = styled.input`
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


export function Checkbox(props: {
    label?: Solid.JSX.Element,
    children?: Solid.JSX.Element,
    labelBefore?: boolean,
    initialValue?: boolean,
    onChange?: (value: boolean) => void,
    onMouseDown?: any,//React.MouseEventHandler<HTMLInputElement>,
    disabled?: boolean,
    style?: Solid.JSX.CSSProperties,
})
{
    const labelId = Solid.createUniqueId()

    const onChange = (ev: any) => {
        const newValue = ev.target.checked
        //console.log("onChange", newValue)

        if (props.onChange)
            props.onChange(newValue)
    }


    const label = props.children ?? props.label

	return <>
        <Solid.Show when={ label && props.labelBefore }>
            <LabelCheckbox
                html-for={ labelId }
            >
                { label }
            </LabelCheckbox>
        </Solid.Show>
        
        <StyledCheckbox
            id={ labelId }
            type="checkbox"
            checked={ props.initialValue }
            onChange={ onChange }
            disabled={ props.disabled }
            style={ props.style }
        />

        <Solid.Show when={ label && !props.labelBefore }>
            <LabelCheckbox
                html-for={ labelId }
            >
                { label }
            </LabelCheckbox>
        </Solid.Show>
	</>
}