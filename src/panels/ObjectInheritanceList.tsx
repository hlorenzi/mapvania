import * as React from "react"
import styled from "styled-components"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Properties from "../data/properties"
import * as Editors from "../data/editors"
import * as Images from "../data/images"
import * as MapEditor from "../mapEditor"
import * as UI from "../ui"
import { global } from "../global"


export function ObjectInheritanceList(props: {
    value: Defs.DefObject["inheritPropertiesFromObjectDefs"],
    onChange: (newList: Defs.DefObject["inheritPropertiesFromObjectDefs"]) => void,
})
{
    const set = (index: number, newValue: ID.ID) =>
    {
        props.onChange([
            ...props.value.slice(0, index),
            newValue,
            ...props.value.slice(index + 1),
        ])
    }

    const create = () =>
    {
        props.onChange([
            ...props.value,
            "",
        ])
    }

    const remove = (index: number) =>
    {
        props.onChange([
            ...props.value.slice(0, index),
            ...props.value.slice(index + 1),
        ])
    }

    return <UI.Grid template="auto 1fr">

        { props.value.map((id, i) =>
            <React.Fragment key={ i }>
                <UI.Cell justifyEnd>
                    <UI.Button
                        label="❌"
                        onClick={ () => remove(i) }
                    />
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <UI.Input
                        value={ id }
                        onChange={ value => set(i, value) }
                        placeholder="Parent Object ID"
                        fullWidth
                    />
                </UI.Cell>

            </React.Fragment>
        )}

        <UI.Cell span={ 2 } justifyStart>
            <UI.Button
                label="➕ Parent"
                onClick={ create }
            />
        </UI.Cell>

    </UI.Grid>
}