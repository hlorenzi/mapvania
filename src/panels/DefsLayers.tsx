import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as UI from "../ui"
import { global } from "../global"
import styled from "styled-components"
import { DeepAssignable } from "../util/deepAssign"


export function DefsLayers(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs
    const modify = (newDefs: DeepAssignable<Defs.Defs>) =>
    {
        Editors.deepAssignEditor(props.editorIndex, {
            defs: newDefs,
        })
    }

    const [curLayerId, setCurLayerId] = React.useState<ID.ID>("")
    const curLayerIndex = defs.layerDefs.findIndex(l => l.id === curLayerId)
    const curLayer = defs.layerDefs.find(l => l.id === curLayerId)


    const modifyLayer = (layerDef: DeepAssignable<Defs.DefLayer>) =>
    {
        if (curLayerIndex < 0)
            return

        modify({ layerDefs: { [curLayerIndex]: layerDef }})
    }


    const createLayer = (layerDef: Defs.DefLayer) =>
    {
        const [newNextIDs, newID] = ID.getNextID(defs.nextIDs)
        modify({
            nextIDs: newNextIDs,
            layerDefs: { [defs.layerDefs.length]:
                {
                    ...layerDef,
                    id: newID,
                }
            },
        })
        return newID
    }


    const createTileLayer = () =>
    {
        const layerDef: Defs.DefLayerTile = {
            type: "tile",
            id: null!,
            name: "New Layer " + (defs.layerDefs.length + 1),
            gridCellWidth: 16,
            gridCellHeight: 16,
        }

        const newId = createLayer(layerDef)
        setCurLayerId(newId)
    }


    const createObjectLayer = () =>
    {
        const layerDef: Defs.DefLayerObject = {
            type: "object",
            id: null!,
            name: "New Layer " + (defs.layerDefs.length + 1),
            gridCellWidth: 16,
            gridCellHeight: 16,
        }

        const newId = createLayer(layerDef)
        setCurLayerId(newId)
    }


    const deleteCurLayer = () =>
    {
        modify({
            layerDefs: defs.layerDefs.filter(l => l.id !== curLayerId),
        })
    }


    const moveCurLayerUp = () =>
    {
        if (curLayerIndex <= 0)
            return
            
        modify({
            layerDefs: [
                ...defs.layerDefs.slice(0, curLayerIndex - 1),
                curLayer!,
                defs.layerDefs[curLayerIndex - 1],
                ...defs.layerDefs.slice(curLayerIndex + 1),
            ],
        })
    }


    const moveCurLayerDown = () =>
    {
        if (curLayerIndex >= defs.layerDefs.length - 1)
            return

        modify({
            layerDefs: [
                ...defs.layerDefs.slice(0, curLayerIndex),
                defs.layerDefs[curLayerIndex + 1],
                curLayer!,
                ...defs.layerDefs.slice(curLayerIndex + 2),
            ],
        })
    }


    const getLayerIcon = (layerDef: Defs.DefLayer) =>
    {
        return layerDef.type == "tile" ? "🧱" :
            layerDef.type == "object" ? "🍎" :
            ""
    }


    const getLayerType = (layerDef: Defs.DefLayer) =>
    {
        return layerDef.type == "tile" ? "Tile Layer" :
            layerDef.type == "object" ? "Object Layer" :
            ""
    }


    return <UI.Grid template="15em 25em" templateRows="auto 1fr" fullHeight>

        <UI.Cell>
            <UI.Button
                label="+ Tile Layer"
                onClick={ createTileLayer }
            />

            <UI.Button
                label="+ Object Layer"
                onClick={ createObjectLayer }
            />
        </UI.Cell>

        <UI.Cell/>

        <UI.List
            value={ curLayerId }
            onChange={ setCurLayerId }
            items={ defs.layerDefs.map(layerDef => ({
                id: layerDef.id,
                label: getLayerIcon(layerDef) + " " + layerDef.name,
            }))}
        />

        { curLayer && <UI.Grid template="auto auto" key={ curLayer.id }>

            <UI.Cell justifyEnd>
                Name
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.Input
                    value={ curLayer.name }
                    onChange={ (value) => modifyLayer({ name: value }) }
                    fullWidth
                />
            </UI.Cell>
            
            <UI.Cell span={ 2 } justifyEnd>
                <UI.Button
                    label="🔼"
                    onClick={ moveCurLayerUp }
                />

                <UI.Button
                    label="🔽"
                    onClick={ moveCurLayerDown }
                />

                <UI.Button
                    label="❌ Delete"
                    onClick={ deleteCurLayer }
                />
            </UI.Cell>

            <UI.Cell span={ 2 } divider/>

            <UI.Cell justifyEnd>
                Grid Size
            </UI.Cell>

            <UI.Cell>
                <UI.Input
                    number
                    value={ curLayer.gridCellWidth }
                    onChangeNumber={ (value) => modifyLayer({ gridCellWidth: value }) }
                />
                { " × " }
                <UI.Input
                    number
                    value={ curLayer.gridCellHeight }
                    onChangeNumber={ (value) => modifyLayer({ gridCellHeight: value }) }
                />
                { " px" }
            </UI.Cell>

        </UI.Grid> }

    </UI.Grid>
}