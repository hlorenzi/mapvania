import * as React from "react"
import styled from "styled-components"


const StyledList = styled.div`
    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: #242424;

    width: 100%;
    height: 100%;

    overflow-x: hidden;
    overflow-y: auto;

    box-sizing: border-box;
    border: 1px solid var(--dockable-panelInactiveBorder);
    outline: none;
    border-radius: 0;
`


const StyledListItem = styled.button<{
    selected: boolean,
}>`
    display: block;
    width: 100%;

    border: 0;
    outline: none;
    
    appearance: button;
    color: inherit;
    background-color: ${ props => props.selected ? "#373737" : "transparent" };
    text-decoration: none;
    text-align: left;
    cursor: pointer;
    
    box-sizing: border-box;
    margin: 0;
    padding: 0.4em 1em;
    font-family: inherit;
    font-weight: inherit;
    font-size: 1em;

    &:hover
    {
        background-color: ${ props => props.selected ? "#373737" : "#2d2d2d" };
    }
`


export interface ListItem
{
    id: any
    label: React.ReactNode
}


export function List(props: {
    items: ListItem[],
    value?: any,
    onChange?: (newValue: any) => void,
    disabled?: boolean,
    style?: React.CSSProperties,
})
{
    const onChange = (newId: any) =>
    {
        if (props.onChange)
            props.onChange(newId)
    }


    return <StyledList
        style={ props.style }
    >
        { props.items.map(item =>
            <StyledListItem
                key={ item.id }
                onMouseDown={ () => onChange(item.id) }
                onClick={ () => onChange(item.id) }
                selected={ props.value === item.id }
            >
                { item.label }
            </StyledListItem>
        )}

    </StyledList>
}