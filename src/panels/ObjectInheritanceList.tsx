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
import { InputObjectPicker } from "./InputObjectPicker"


export function ObjectInheritanceList(props: {
    defs: Defs.Defs,
    value: Defs.DefObject["inheritPropertiesFromObjectDefs"],
    onChange: (newList: Defs.DefObject["inheritPropertiesFromObjectDefs"]) => void,
    basePath: string,
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

    return <UI.Grid template="auto 1fr" alignCenter>

        { props.value.map((id, i) =>
            <React.Fragment key={ i }>
                <UI.Cell justifyEnd>
                    <UI.Button
                        label="❌"
                        onClick={ () => remove(i) }
                    />
                </UI.Cell>

                <InputObjectPicker
                    defs={ props.defs }
                    value={ id }
                    onChange={ value => set(i, value) }
                    basePath={ props.basePath }
                    header="Select a parent object"
                />

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