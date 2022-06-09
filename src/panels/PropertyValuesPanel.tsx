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


export function PropertyValuesPanel(props: {
    defProperties: Properties.DefProperties,
    properties: Properties.Properties,
    setProperties: (newProperties: Properties.Properties) => void,
})
{


    return <UI.Grid template="auto auto">

        { Object.values(props.defProperties).map(field =>
        {
            switch (field.type)
            {
                case "string":
                    return <FieldString
                        key={ field.id }
                        field={ field }
                        value={ props.properties[field.id] }
                        setValue={ (newValue) => {} }
                    />
            }
        })}

    </UI.Grid>
}


export function FieldString(props: {
    field: Properties.DefField,
    value: Properties.FieldValue,
    setValue: (newValue: Properties.FieldValue) => void,
})
{
    return <>
        <UI.Cell justifyEnd>
            { props.field.id }
        </UI.Cell>

        <UI.Cell justifyStretch>
            <UI.Input
                value={ props.value as string }
                onChange={ (value) => props.setValue(value) }
                fullWidth
            />
        </UI.Cell>
    </>
}