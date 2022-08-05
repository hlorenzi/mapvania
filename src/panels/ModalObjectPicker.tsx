import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as Hierarchy from "../data/hierarchy"
import * as ID from "../data/id"
import * as Images from "../data/images"
import * as UI from "../ui"


export function ModalObjectPicker(props: {
    open: boolean,
    setOpen: (open: boolean) => void,
    defs: Defs.Defs,
    header?: string,
    value: ID.ID,
    onChange?: (newValue: ID.ID) => void,
})
{
    const onChangeInner = (id: ID.ID) =>
    {
        if (id.startsWith(Hierarchy.FOLDER_ID_PREFIX))
            return

        props.onChange?.(id)
    }


    return <UI.Modal
        open={ props.open }
        setOpen={ props.setOpen }
    >
        <UI.HeaderAndBody
            header={ props.header ?? "Select an object" }
        >

            <UI.Grid template="30em" templateRows="60vh">

                <UI.HierarchicalList<Defs.DefObject>
                    is2D
                    items={ props.defs.objectDefs }
                    value={ props.value }
                    onChange={ onChangeInner }
                    getItemIcon={ item => Defs.getObjectDefIconElement(item) }
                    getItemLabel={ item => item.name }
                />

            </UI.Grid>

        </UI.HeaderAndBody>

    </UI.Modal>
}