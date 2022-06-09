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
import { deepAssign, DeepAssignable } from "../util/deepAssign"


export function PropertyDefsPanel(props: {
    defProperties: Properties.DefProperties,
    setDefProperties: (newDefProperties: Properties.DefProperties) => void,
})
{
    return <FieldArray
        fields={ props.defProperties }
        setFields={ props.setDefProperties }
    />
}


export function FieldArray(props: {
    fields: Properties.DefField[],
    setFields: (newFields: Properties.DefField[]) => void,
})
{
    const modifyField = (index: number, newDefProperties: Properties.DefField) =>
    {
        props.setFields([
            ...props.fields.slice(0, index),
            newDefProperties,
            ...props.fields.slice(index + 1),
        ])
    }


    const createField = () =>
    {
        const field = Properties.makeDefFieldOfType(
            "field_" + Object.values(props.fields).length,
            "string")

        props.setFields([
            ...props.fields,
            field,
        ])
    }


    const removeField = (index: number) =>
    {
        props.setFields([
            ...props.fields.slice(0, index),
            ...props.fields.slice(index + 1),
        ])
    }


    return <UI.Grid template="auto auto auto">

        <UI.Cell span={3} justifyEnd>
            <UI.Button
                label="➕ Field"
                onClick={ createField }
            />
        </UI.Cell>

        { props.fields.map((field, i) =>
            <Field
                key={ i }
                field={ field }
                setField={ (newField) => modifyField(i, newField) }
                removeField={ () => removeField(i) }
            />
        )}

    </UI.Grid>
}


export function Field(props: {
    field: Properties.DefField,
    setField: (newValue: Properties.DefField) => void,
    removeField?: () => void,
})
{
    let fieldElem = <></>

    switch (props.field.type)
    {
        case "optional":
            fieldElem = <FieldOptional
                field={ props.field }
                setField={ props.setField }
            />
            break
            
        case "struct":
            fieldElem = <FieldStruct
                field={ props.field }
                setField={ props.setField }
            />
            break
    }

    return <>

        <UI.Cell justifyStretch>
            <UI.Select
                value={ props.field.type }
                onChange={ (newValue) => props.setField(Properties.makeDefFieldOfType(props.field.id, newValue as Properties.DefField["type"])) }
            >
                <option value="bool">Bool</option>
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="point">Point</option>
                <option value="rect">Rect</option>
                <option value="optional">Optional</option>
                <option value="struct">Struct</option>
            </UI.Select>
        </UI.Cell>

        <UI.Cell justifyStretch>
            <UI.Input
                value={ props.field.id }
                onChange={ (value) => props.setField({ ...props.field, id: value }) }
                fullWidth
            />
        </UI.Cell>
        
        <UI.Cell justifyEnd>
            { props.removeField &&
                <UI.Button
                    label="❌"
                    onClick={ props.removeField }
                />
            }
        </UI.Cell>

        { fieldElem }

    </>
}


function Tabulation(props: {
    children: React.ReactNode,
})
{
    return <UI.Cell span={ 3 } justifyStretch>
        <div style={{
            paddingLeft: "1em",
            paddingBottom: "0.25em",
            borderLeft: "0.25em solid #2d2d2d",
            borderBottom: "0.25em solid #2d2d2d",
            borderBottomLeftRadius: "1em",
        }}>
            { props.children }
        </div>
    </UI.Cell>
}


function FieldOptional(props: {
    field: Properties.DefFieldOptional,
    setField: (newValue: Properties.DefFieldOptional) => void,
})
{
    return <Tabulation>
        <UI.Grid template="auto auto auto">
            <Field
                field={ props.field.field }
                setField={ (newField) => props.setField({ ...props.field, field: newField }) }
            />
        </UI.Grid>
    </Tabulation>
}


export function FieldStruct(props: {
    field: Properties.DefFieldStruct,
    setField: (newValue: Properties.DefFieldStruct) => void,
})
{
    return <Tabulation>
        <FieldArray
            fields={ props.field.fields }
            setFields={ (newFields) => props.setField({ ...props.field, fields: newFields }) }
        />
    </Tabulation>
}