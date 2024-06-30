import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as Hierarchy from "../data/hierarchy"
import * as UI from "../ui"
import { global } from "../global"
import styled from "styled-components"
import { useCachedState } from "../util/useCachedState"


export function DefsTileAttributes(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs
    
    const [listState, setListState] = useCachedState(
        "DefsTileAttributes_ListState",
        UI.makeHierarchicalListState())

    const curTileAttrbId = listState.lastSelectedId
    const curTileAttrbIndex = defs.tileAttributeDefs.findIndex(l => l.id === curTileAttrbId)
    const curTileAttrb = defs.tileAttributeDefs.find(l => l.id === curTileAttrbId)


    const setDefs = (fn: (old: Defs.Defs) => Defs.Defs) =>
    {
        Editors.assignEditorDefs(props.editorIndex, fn)
    }


    const set = (tileAttrbDef: Defs.DefTileAttribute) =>
    {
        if (curTileAttrbIndex < 0)
            return

        setDefs(defs => ({
            ...defs,
            tileAttributeDefs: Hierarchy.setItem(
                defs.tileAttributeDefs,
                curTileAttrbIndex,
                tileAttrbDef),
        }))
    }


    const create = () =>
    {
        const [nextIDs, id] = ID.getNextID(defs.nextIDs)
        const tileAttrb = Defs.makeNewTileAttributeDef(id)

        setDefs(defs => ({ ...defs, nextIDs }))
        return tileAttrb
    }


    return <UI.Grid template="15em 25em" templateRows="1fr" fullHeight>

        <UI.HierarchicalList<Defs.DefTileAttribute>
            disallowFolders
            items={ defs.tileAttributeDefs }
            setItems={ fn => setDefs(defs => ({ ...defs, tileAttributeDefs: fn(defs.tileAttributeDefs) })) }
            createItem={ create }
            state={ listState }
            setState={ setListState }
            getItemIcon={ item => Defs.getTileAttributeDefIconElement(item) }
            getItemLabel={ item => item.name }
        />

        { curTileAttrb && <UI.Grid template="auto auto" key={ curTileAttrb.id }>

            <UI.Cell justifyEnd>
                Name
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.Input
                    valueSignal={ curTileAttrb.name }
                    onChange={ (value) => set({ ...curTileAttrb, name: value }) }
                    fullWidth
                />
            </UI.Cell>

            <UI.Cell justifyEnd>
                ID
            </UI.Cell>

            <UI.Cell justifyStart>
                { curTileAttrb.id }
            </UI.Cell>
            
            <UI.Cell span={ 2 } divider/>

            <UI.Cell justifyEnd>
                Label
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.Input
                    valueSignal={ curTileAttrb.label }
                    onChange={ (value) => set({ ...curTileAttrb, label: value }) }
                    fullWidth
                />
            </UI.Cell>
            
            <UI.Cell justifyEnd>
                Color
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.InputColor
                    value={ curTileAttrb.color }
                    onChange={ (value) => set({ ...curTileAttrb, color: value }) }
                    fullWidth
                />
            </UI.Cell>
            
        </UI.Grid> }

    </UI.Grid>
}