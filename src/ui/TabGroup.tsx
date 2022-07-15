import * as React from "react"
import styled from "styled-components"


const StyledTabGroupLayout = styled.div`
    display: grid;
    grid-template: auto / auto;
    grid-auto-flow: column;
    justify-content: center;

    border-bottom: 1px solid var(--dockable-panelInactiveBorder);
`


const StyledTab = styled.button<{
    selected: boolean,
}>`
    display: inline-block;

    border: 0;
    
    appearance: button;
    display: inline-block;
    color: ${ props => props.selected ? "inherit" : "#545454" };
    text-decoration: ${ props => props.selected ? "underline" : "none" };
    background-color: transparent;
    cursor: pointer;
    box-sizing: border-box;

    margin: 0;
    padding: 0.4em 1em;
    font-family: inherit;
    font-weight: inherit;
    font-size: 1em;
`


export function TabGroup(props: {
    value?: number,
    onChange?: (newValue: number) => void,
    labels: React.ReactNode[],
})
{
    const [value, setValue] = React.useState(() => props.value !== undefined ? props.value : 0)

    const indexSelected = props.value !== undefined ? props.value : value

    const onChange = (i: number) =>
    {
        if (props.onChange)
            props.onChange(i)
        else
            setValue(i)
    }

    return <StyledTabGroupLayout>
        { props.labels.map((label, i) =>
            <StyledTab
                key={ i }
                selected={ i === indexSelected }
                onClick={ () => onChange(i) }
            >
                { label }
            </StyledTab>
        )}
    </StyledTabGroupLayout>
}