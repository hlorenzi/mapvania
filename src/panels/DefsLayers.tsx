import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as Hierarchy from "../data/hierarchy"
import * as UI from "../ui"
import { global } from "../global"
import styled from "styled-components"
import { useCachedState } from "../util/useCachedState"


export function DefsLayers(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs


    const [listState, setListState] = useCachedState(
        "DefsLayers_ListState",
        UI.makeHierarchicalListState())


    const curLayerId = listState.lastSelectedId
    const curLayerIndex = defs.layerDefs.findIndex(l => l.id === curLayerId)
    const curLayer = defs.layerDefs.find(l => l.id === curLayerId)


    const setDefs = (fn: (old: Defs.Defs) => Defs.Defs) =>
    {
        Editors.assignEditorDefs(props.editorIndex, fn)
    }


    const set = (layerDef: Defs.DefLayer) =>
    {
        setDefs(defs => ({
            ...defs,
            layerDefs: Hierarchy.setItem(
                defs.layerDefs,
                curLayerIndex,
                layerDef),
        }))
    }


    const create = () =>
    {
        const [nextIds, id] = ID.getNextID(defs.nextIDs)
        const layerDef = Defs.makeNewLayerDef(id)

        setDefs(defs => ({ ...defs, nextIDs: nextIds }))
        return layerDef
    }


    return <UI.Grid template="15em 25em" templateRows="1fr" fullHeight>

        <UI.HierarchicalList<Defs.DefLayer>
            disallowFolders
            items={ defs.layerDefs }
            setItems={ fn => setDefs(defs => ({ ...defs, layerDefs: fn(defs.layerDefs) })) }
            createItem={ create }
            state={ listState }
            setState={ setListState }
            getItemIcon={ item => Defs.getLayerDefIconElement(item) }
            getItemLabel={ item => item.name }
        />

        { curLayer && <UI.Grid template="auto auto" key={ curLayer.id }>

            <UI.Cell justifyEnd>
                Name
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.Input
                    value={ curLayer.name }
                    onChange={ (value) => set({ ...curLayer, name: value }) }
                    fullWidth
                />
            </UI.Cell>

            <UI.Cell span={ 2 } divider/>

            <UI.Cell justifyEnd>
                Type
            </UI.Cell>

            <UI.Cell>
                <UI.Select
                    value={ curLayer.type }
                    onChange={ (value) => set({ ...curLayer, type: value as Defs.DefLayer["type"] }) }
                >
                    <option value="tile">Tile</option>
                    <option value="object">Object</option>
                </UI.Select>
            </UI.Cell>

            <UI.Cell justifyEnd>
                Grid Size
            </UI.Cell>

            <UI.Cell>
                <UI.Input
                    number
                    value={ curLayer.gridCellWidth }
                    onChangeNumber={ (value) => set({ ...curLayer, gridCellWidth: value }) }
                />
                { " × " }
                <UI.Input
                    number
                    value={ curLayer.gridCellHeight }
                    onChangeNumber={ (value) => set({ ...curLayer, gridCellHeight: value }) }
                />
                { " px" }
            </UI.Cell>

        </UI.Grid> }

    </UI.Grid>
}