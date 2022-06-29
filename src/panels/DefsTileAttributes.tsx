import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as UI from "../ui"
import { global } from "../global"
import styled from "styled-components"
import { DeepAssignable } from "../util/deepAssign"


export function DefsTileAttributes(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs
    const modifyDefs = (newDefs: DeepAssignable<Defs.Defs>) =>
    {
        Editors.deepAssignEditor(props.editorIndex, {
            defs: newDefs,
        })
    }

    const [curTileAttrbId, setCurTileAttrbId] = React.useState<ID.ID>("")
    const curTileAttrbIndex = defs.tileAttributeDefs.findIndex(l => l.id === curTileAttrbId)
    const curTileAttrb = defs.tileAttributeDefs.find(l => l.id === curTileAttrbId)


    const modify = (tileAttrbDef: DeepAssignable<Defs.DefTileAttribute>) =>
    {
        if (curTileAttrbIndex < 0)
            return

        modifyDefs({ tileAttributeDefs: { [curTileAttrbIndex]: tileAttrbDef }})
    }


    const create = () =>
    {
        const [newNextIDs, newID] = ID.getNextID(defs.nextIDs)
        modifyDefs({
            nextIDs: newNextIDs,
            tileAttributeDefs: { [defs.tileAttributeDefs.length]:
                {
                    id: newID,
                    name: "attribute_" + defs.tileAttributeDefs.length,
                    label: "A",
                    color: "#ffffff",
                }
            },
        })
        setCurTileAttrbId(newID)
    }


    const erase = () =>
    {
        modifyDefs({
            tileAttributeDefs: defs.tileAttributeDefs.filter(a => a.id !== curTileAttrbId),
        })
    }


    const moveUp = () =>
    {
        if (curTileAttrbIndex <= 0)
            return
            
        modifyDefs({
            tileAttributeDefs: [
                ...defs.tileAttributeDefs.slice(0, curTileAttrbIndex - 1),
                curTileAttrb!,
                defs.tileAttributeDefs[curTileAttrbIndex - 1],
                ...defs.tileAttributeDefs.slice(curTileAttrbIndex + 1),
            ],
        })
    }


    const moveDown = () =>
    {
        if (curTileAttrbIndex >= defs.tileAttributeDefs.length - 1)
            return

        modifyDefs({
            tileAttributeDefs: [
                ...defs.tileAttributeDefs.slice(0, curTileAttrbIndex),
                defs.tileAttributeDefs[curTileAttrbIndex + 1],
                curTileAttrb!,
                ...defs.tileAttributeDefs.slice(curTileAttrbIndex + 2),
            ],
        })
    }


    return <UI.Grid template="15em 25em" templateRows="auto 1fr" fullHeight>

        <UI.Cell>
            <UI.Button
                label="➕ Tile Attribute"
                onClick={ create }
            />
        </UI.Cell>

        <UI.Cell/>

        <UI.List
            value={ curTileAttrbId }
            onChange={ setCurTileAttrbId }
            items={ defs.tileAttributeDefs.map(tileAttrbDef => ({
                id: tileAttrbDef.id,
                label: tileAttrbDef.name,
                icon: Defs.getTileAttributeDefIconElement(tileAttrbDef),
            }))}
        />

        { curTileAttrb && <UI.Grid template="auto auto" key={ curTileAttrb.id }>

            <UI.Cell justifyEnd>
                Name
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.Input
                    value={ curTileAttrb.name }
                    onChange={ (value) => modify({ name: value }) }
                    fullWidth
                />
            </UI.Cell>
            
            <UI.Cell span={ 2 } justifyEnd>
                <UI.Button
                    label="🔼"
                    onClick={ moveUp }
                />

                <UI.Button
                    label="🔽"
                    onClick={ moveDown }
                />

                <UI.Button
                    label="❌ Delete"
                    onClick={ erase }
                />
            </UI.Cell>

            <UI.Cell span={ 2 } divider/>

            <UI.Cell justifyEnd>
                Label
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.Input
                    value={ curTileAttrb.label }
                    onChange={ (value) => modify({ label: value }) }
                    fullWidth
                />
            </UI.Cell>
            
            <UI.Cell justifyEnd>
                Color
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.InputColor
                    value={ curTileAttrb.color }
                    onChange={ (value) => modify({ color: value }) }
                    fullWidth
                />
            </UI.Cell>
            
        </UI.Grid> }

    </UI.Grid>
}