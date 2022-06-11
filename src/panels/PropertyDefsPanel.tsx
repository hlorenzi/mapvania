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


    return <UI.Grid template="auto auto auto auto">

        { props.fields.map((field, i) =>
            <Field
                key={ i }
                field={ field }
                setField={ (newField) => modifyField(i, newField) }
                removeField={ () => removeField(i) }
            />
        )}

        <UI.Cell span={4} justifyStart>
            <UI.Button
                label="➕ Field"
                onClick={ createField }
            />
        </UI.Cell>

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
        case "bool":
            fieldElem = <FieldBool
                field={ props.field }
                setField={ props.setField }
            />
            break

        case "string":
            fieldElem = <FieldString
                field={ props.field }
                setField={ props.setField }
            />
            break

        case "number":
            fieldElem = <FieldNumber
                field={ props.field }
                setField={ props.setField }
            />
            break

        case "point":
            fieldElem = <FieldPoint
                field={ props.field }
                setField={ props.setField }
            />
            break

        case "rect":
            fieldElem = <FieldRect
                field={ props.field }
                setField={ props.setField }
            />
            break

        case "choice":
            fieldElem = <FieldChoice
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

        case "list":
            fieldElem = <FieldList
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
                <option value="enum">Enum</option>
                <option value="choice">Choice</option>
                <option value="struct">Struct</option>
                <option value="list">List</option>
            </UI.Select>
        </UI.Cell>

        <UI.Cell justifyStretch>
            <UI.Checkbox
                label="Opt."
                value={ props.field.optional }
                onChange={ (value) => props.setField({ ...props.field, optional: value }) }
            />
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

        <UI.Cell span={ 4 }>
            <div style={{ paddingBottom: "1em" }}/>
        </UI.Cell>

    </>
}


function Tabulation(props: {
    children: React.ReactNode,
})
{
    return <UI.Cell span={ 4 } justifyStretch>
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


export function FieldBool(props: {
    field: Properties.DefFieldBool,
    setField: (newValue: Properties.DefFieldBool) => void,
})
{
    return <Tabulation>
        <UI.Grid template="auto 1fr">
            <UI.Cell justifyEnd>
                Default
            </UI.Cell>

            <UI.Cell justifyStart>
                <UI.Checkbox
                    value={ props.field.defaultValue }
                    onChange={ (value) => props.setField({ ...props.field, defaultValue: value }) }
                />
            </UI.Cell>
        </UI.Grid>
    </Tabulation>
}


export function FieldString(props: {
    field: Properties.DefFieldString,
    setField: (newValue: Properties.DefFieldString) => void,
})
{
    return <Tabulation>
        <UI.Grid template="auto 1fr">
            <UI.Cell justifyEnd>
                Default
            </UI.Cell>

            <UI.Cell>
                <UI.Input
                    value={ props.field.defaultValue }
                    onChange={ (value) => props.setField({ ...props.field, defaultValue: value }) }
                    fullWidth
                />
            </UI.Cell>
        </UI.Grid>
    </Tabulation>
}


export function FieldNumber(props: {
    field: Properties.DefFieldNumber,
    setField: (newValue: Properties.DefFieldNumber) => void,
})
{
    return <Tabulation>
        <UI.Grid template="auto 1fr">
            <UI.Cell justifyEnd>
                Default
            </UI.Cell>

            <UI.Cell>
                <UI.Input
                    number
                    value={ props.field.defaultValue }
                    onChangeNumber={ (value) => props.setField({ ...props.field, defaultValue: value }) }
                    fullWidth
                />
            </UI.Cell>
        </UI.Grid>
    </Tabulation>
}


export function FieldPoint(props: {
    field: Properties.DefFieldPoint,
    setField: (newValue: Properties.DefFieldPoint) => void,
})
{
    return <Tabulation>
        <UI.Grid template="auto 1fr">
            <UI.Cell justifyEnd>
                Relative
            </UI.Cell>

            <UI.Cell justifyStart>
                <UI.Checkbox
                    value={ props.field.relative }
                    onChange={ (value) => props.setField({ ...props.field, relative: value }) }
                />
            </UI.Cell>

            <UI.Cell justifyEnd>
                Show Ghost
            </UI.Cell>

            <UI.Cell justifyStart>
                <UI.Checkbox
                    value={ props.field.showGhost }
                    onChange={ (value) => props.setField({ ...props.field, showGhost: value }) }
                />
            </UI.Cell>
        </UI.Grid>
    </Tabulation>
}


export function FieldRect(props: {
    field: Properties.DefFieldRect,
    setField: (newValue: Properties.DefFieldRect) => void,
})
{
    return <Tabulation>
        <UI.Grid template="auto 1fr">
            <UI.Cell justifyEnd>
                Relative
            </UI.Cell>

            <UI.Cell justifyStart>
                <UI.Checkbox
                    value={ props.field.relative }
                    onChange={ (value) => props.setField({ ...props.field, relative: value }) }
                />
            </UI.Cell>
        </UI.Grid>
    </Tabulation>
}


export function FieldChoice(props: {
    field: Properties.DefFieldChoice,
    setField: (newValue: Properties.DefFieldChoice) => void,
})
{
    return <Tabulation>
        <FieldArray
            fields={ props.field.choices }
            setFields={ (newFields) => props.setField({ ...props.field, choices: newFields }) }
        />
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


export function FieldList(props: {
    field: Properties.DefFieldList,
    setField: (newValue: Properties.DefFieldList) => void,
})
{
    return <Tabulation>
        <UI.Grid template="auto 1fr">
            <UI.Cell justifyEnd>
                Show Path
            </UI.Cell>

            <UI.Cell justifyStart>
                <UI.Checkbox
                    value={ props.field.showPath }
                    onChange={ (value) => props.setField({ ...props.field, showPath: value }) }
                />
            </UI.Cell>
            
            <UI.Cell span={ 4 }>
                <UI.Grid template="auto auto auto auto">
                    <Field
                        field={ props.field.element }
                        setField={ (newField) => props.setField({ ...props.field, element: newField }) }
                    />
                </UI.Grid>
            </UI.Cell>
        </UI.Grid>
    </Tabulation>
}