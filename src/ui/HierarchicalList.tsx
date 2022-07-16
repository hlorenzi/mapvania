import * as React from "react"
import styled from "styled-components"
import * as Hierarchy from "../data/hierarchy"
import { Button } from "./Button"


const StyledRoot = styled.div`
    display: grid;
    grid-template: auto auto 1fr / 1fr;

    width: 100%;
    height: 100%;
    min-height: 0;
`


const StyledHeader = styled.div`
    display: flex;
    align-items: baseline;
    width: 100%;

    outline: none;
    
    background-color: #3d3d3d;
    text-decoration: none;
    text-align: left;
    user-select: none;
    
    margin: 0;
    padding: 0.2em 0.4em;
    font-family: inherit;
    font-weight: inherit;
    font-size: 1em;
`


const StyledList = styled.div<{
    is2D: boolean,
}>`
    font-size: 1em;
    font-family: inherit;
    color: inherit;
    background-color: #242424;

    width: 100%;
    height: 100%;

    overflow-x: hidden;
    overflow-y: scroll;

    box-sizing: border-box;
    outline: none;
    border-radius: 0;

    ${ props => !props.is2D ? "" : `
        display: grid;
        grid-template: auto / repeat(5, 1fr);
        align-content: start;
        align-items: start;
        justify-items: start;
        justify-content: stretch;
    `}
`


const StyledListItem = styled.button<{
    is2D: boolean,
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

    ${ props => !props.is2D ? "" : `
        width: 5.7em;
        height: 6em;
        flex-grow: 1;
        padding: 0;
        text-align: center;
    `}

    &:hover
    {
        background-color: ${ props => props.selected ? "#373737" : "#2d2d2d" };
    }

    &:focus
    {
        outline: solid #666666;
        outline-width: 1px;
        outline-offset: -1px;
    }
`


const StyledListInner = styled.div<{
    is2D: boolean,
}>`
    display: grid;
    grid-template: auto / auto auto;
    column-gap: 0.25em;

    justify-content: start;
    justify-items: start;
    align-content: center;
    align-items: center;

    ${ props => !props.is2D ? "" : `
        grid-template: 1fr auto / 1fr;
        width: 100%;
        height: 100%;

        justify-content: center;
        justify-items: center;
        align-content: center;
        align-items: center;
    `}
`


const StyledListLabel = styled.div`
    width: 100%;

    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`


export interface HierarchicalListState
{
    currentFolder: string[]
    lastSelectedId: string
    selectedIds: Set<string>
    scrollTop: number
}


export function makeHierarchicalListState(): HierarchicalListState
{
    return {
        currentFolder: [],
        lastSelectedId: "",
        selectedIds: new Set<string>(),
        scrollTop: 0,
    }
}


export function HierarchicalList<T extends Hierarchy.Item>(props: {
    items: Hierarchy.Items<T>,
    setItems?: (newItems: Hierarchy.Items<T>) => void,
    value?: string,
    onChange?: (id: string) => void,
    state: HierarchicalListState,
    setState: React.Dispatch<React.SetStateAction<HierarchicalListState>>,
    getItemIcon: (item: T) => React.ReactNode,
    getItemLabel: (item: T) => React.ReactNode,
    createItem?: () => T,
    is2D?: boolean,
    disabled?: boolean,
    style?: React.CSSProperties,
})
{
    const scrollParentRef = React.useRef<HTMLDivElement>(null)


    const currentItemsAndSubfolders = React.useMemo(() =>
        Hierarchy.getItemsAndSubfoldersAt(
            props.items,
            props.state.currentFolder)
    , [props.items, props.state.currentFolder.join(Hierarchy.FOLDER_SEPARATOR)])


    const onSelectItem = (id: string, ctrlSelect: boolean, shiftSelect: boolean) =>
    {
        if (props.onChange)
            props.onChange(id)
        
        props.setState(s =>
        {
            let selectedIds = s.selectedIds

            if (ctrlSelect)
            {
                if (selectedIds.has(id))
                    selectedIds.delete(id)
                else
                    selectedIds.add(id)
            }

            else if (shiftSelect)
            {
                const idsInRange = Hierarchy.getRangeOfIdsBetween(
                    currentItemsAndSubfolders,
                    s.lastSelectedId,
                    id)

                for (const id of idsInRange)
                    selectedIds.add(id)
            }
            
            else
            {
                selectedIds.clear()
                selectedIds.add(id)
            }

            return {
                ...s,
                lastSelectedId: id,
                selectedIds,
            }
        })
    }


    const onCreate = () =>
    {
        if (!props.createItem)
            return
        
        const newItem = props.createItem()
        newItem.folder = props.state.currentFolder

        props.setItems?.([
            ...props.items,
            newItem,
        ])

        props.setState(s => ({
            ...s,
            lastSelectedId: newItem.id,
            selectedIds: new Set([newItem.id]),
        }))

        window.requestAnimationFrame(() =>
            scrollParentRef.current?.scrollTo({ top: 9999999 }))
    }


    const onRemove = () =>
    {
        props.setItems?.(props.items.filter(i => !props.state.selectedIds.has(i.id)))
    }


    const onMoveUp = () =>
    {
        props.setItems?.(Hierarchy.moveItems(
            props.items,
            props.state.currentFolder,
            props.state.selectedIds,
            -1))        
    }


    const onMoveDown = () =>
    {
        props.setItems?.(Hierarchy.moveItems(
            props.items,
            props.state.currentFolder,
            props.state.selectedIds,
            1))        
    }


    const onMoveUpOneFolderLevel = () =>
    {
        props.setState(s => ({
            ...s,
            currentFolder: s.currentFolder.slice(0, s.currentFolder.length - 1),
            selectedIds: new Set(),
        }))
    }


    const onEnterFolder = (folder: string[]) =>
    {
        props.setState(s => ({
            ...s,
            currentFolder: folder,
            selectedIds: new Set(),
        }))
    }


    React.useEffect(() =>
    {
        if (props.value === undefined)
            return

        props.setState(s => ({
            ...s,
            lastSelectedId: props.value!,
            selectedIds: new Set([props.value!]),
        }))

    }, [props.value])


    // Save scroll
    React.useEffect(() =>
    {
        const elem = scrollParentRef.current
        if (!elem)
            return

        const onScroll = (ev: Event) =>
        {
            props.setState(s => ({
                ...s,
                scrollTop: elem.scrollTop,
            }))
        }

        elem.addEventListener("scroll", onScroll)
        return () => elem.removeEventListener("scroll", onScroll)

    }, [props.setState, scrollParentRef.current])


    // Restore scroll
    React.useLayoutEffect(() =>
    {
        const elem = scrollParentRef.current
        if (!elem)
            return

        elem.scrollTop = props.state.scrollTop

    }, [])


    return <StyledRoot style={ props.style }>

        { !props.setItems ?
            <div/>
        :
            <StyledHeader>

                <Button
                    label="➕&#xFE0E; Create"
                    onClick={ onCreate }
                />

                <Button
                    label="▲"
                    onClick={ onMoveUp }
                />

                <Button
                    label="▼"
                    onClick={ onMoveDown }
                />

                <div style={{ flexGrow: 1 }}/>

                <Button
                    label="❌&#xFE0E;"
                    onClick={ onRemove }
                />

            </StyledHeader>
        }
        
        { !props.setItems &&
            props.state.currentFolder.length === 0 &&
            !("isFolder" in currentItemsAndSubfolders[0]) ?
            <div/>
        :
            <StyledHeader>

                <Button
                    label="◀"
                    onClick={ onMoveUpOneFolderLevel }
                />
                { " 📁 " + props.state.currentFolder.join("/") + "/" }

            </StyledHeader>
        }

        <StyledList
            is2D={ !!props.is2D }
            ref={ scrollParentRef }        
        >

            { currentItemsAndSubfolders.map(item =>
            {
                if ("isFolder" in item)
                {
                    return <StyledListItem
                        key={ item.folder.join("/") }
                        is2D={ !!props.is2D }
                        onClick={ ev => onSelectItem(item.id, ev.ctrlKey, ev.shiftKey) }
                        onDoubleClick={ () => onEnterFolder(item.folder) }
                        selected={ props.state.selectedIds.has(item.id) }
                    >
                        <StyledListInner is2D={ !!props.is2D }>
                            <div>📁</div>
                            <StyledListLabel>
                                { item.folder[item.folder.length - 1] + "/" }
                            </StyledListLabel>
                        </StyledListInner>
                    </StyledListItem>
                }
                else
                {
                    return <StyledListItem
                        key={ item.id }
                        is2D={ !!props.is2D }
                        onClick={ ev => onSelectItem(item.id, ev.ctrlKey, ev.shiftKey) }
                        selected={ props.state.selectedIds.has(item.id) }
                    >
                        <StyledListInner is2D={ !!props.is2D }>
                            <div>{ props.getItemIcon(item) }</div>
                            <StyledListLabel>
                                { props.getItemLabel(item) }
                            </StyledListLabel>
                        </StyledListInner>
                    </StyledListItem>
                }
            })}

        </StyledList>
    </StyledRoot>
}