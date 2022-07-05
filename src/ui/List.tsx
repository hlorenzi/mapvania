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


const StyledList2D = styled.div`
    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: #242424;

    display: flex;
    flex-wrap: wrap;
    justify-items: start;
    justify-content: start;
    align-items: start;
    align-content: start;

    width: 100%;
    height: 100%;

    overflow-x: hidden;
    overflow-y: auto;

    box-sizing: border-box;
    border: 1px solid var(--dockable-panelInactiveBorder);
    outline: none;
    border-radius: 0;
`


const StyledList2DItem = styled.button<{
    selected: boolean,
}>`
    display: block;
    width: 5.7em;
    height: 6em;
    flex-grow: 1;

    border: 0;
    outline: none;
    
    appearance: button;
    color: inherit;
    background-color: ${ props => props.selected ? "#373737" : "transparent" };
    text-decoration: none;
    text-align: center;
    cursor: pointer;
    
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: inherit;
    font-weight: inherit;
    font-size: 1em;

    &:hover
    {
        background-color: ${ props => props.selected ? "#373737" : "#2d2d2d" };
    }
`


const StyledListInner = styled.div`
    display: grid;
    grid-template: auto / auto auto;
    column-gap: 0.25em;

    justify-content: start;
    justify-items: start;
    align-content: center;
    align-items: center;
`


const StyledList2DInner = styled.div`
    display: grid;
    grid-template: 1fr auto / 1fr;
    width: 100%;
    height: 100%;

    justify-content: center;
    justify-items: center;
    align-content: center;
    align-items: center;
`


const StyledList2DLabel = styled.div`
    width: 100%;

    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`


export interface ListItem
{
    id: any
    label: React.ReactNode
    icon?: React.ReactNode
}


export function List(props: {
    items: ListItem[],
    is2D?: boolean,
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


    if (props.is2D)
    {
        return <StyledList2D
            style={ props.style }
        >
            { props.items.map(item =>
                <StyledList2DItem
                    key={ item.id }
                    onMouseDown={ () => onChange(item.id) }
                    onClick={ () => onChange(item.id) }
                    selected={ props.value === item.id }
                >
                    <StyledList2DInner>
                        { item.icon }
                        <StyledList2DLabel>
                            { item.label }
                        </StyledList2DLabel>
                    </StyledList2DInner>
                </StyledList2DItem>
            )}
    
        </StyledList2D>
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
                <StyledListInner>
                    { item.icon }
                    { item.label }
                </StyledListInner>
            </StyledListItem>
        )}

    </StyledList>
}