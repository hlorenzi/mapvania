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


    const moveField = (oldIndex: number, newIndex: number) =>
    {
        if (newIndex < 0 || newIndex > props.fields.length)
            return

        const withFieldRemoved = [
            ...props.fields.slice(0, oldIndex),
            ...props.fields.slice(oldIndex + 1),
        ]

        props.setFields([
            ...withFieldRemoved.slice(0, newIndex),
            props.fields[oldIndex],
            ...withFieldRemoved.slice(newIndex),
        ])
    }


    return <UI.Grid template="auto auto auto auto">

        { props.fields.map((field, i) =>
            <Field
                key={ i }
                field={ field }
                setField={ (newField) => modifyField(i, newField) }
                removeField={ () => removeField(i) }
                moveFieldUp={ () => moveField(i, i - 1) }
                moveFieldDown={ () => moveField(i, i + 1) }
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
    moveFieldUp?: () => void,
    moveFieldDown?: () => void,
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

        case "enum":
            fieldElem = <FieldEnum
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
        
        <UI.Cell justifyEnd>
            { props.removeField &&
                <UI.Button
                    label="❌"
                    onClick={ props.removeField }
                />
            }
            { props.moveFieldUp &&
                <UI.Button
                    label="🔼"
                    onClick={ props.moveFieldUp }
                />
            }
            { props.moveFieldDown &&
                <UI.Button
                    label="🔽"
                    onClick={ props.moveFieldDown }
                />
            }
        </UI.Cell>

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
                Color
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.InputColor
                    value={ props.field.color }
                    onChange={ (value) => props.setField({ ...props.field, color: value }) }
                    fullWidth
                />
            </UI.Cell>

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
                Color
            </UI.Cell>

            <UI.Cell justifyStretch>
                <UI.InputColor
                    value={ props.field.color }
                    onChange={ (value) => props.setField({ ...props.field, color: value }) }
                    fullWidth
                />
            </UI.Cell>

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
    setField: (newField: Properties.DefFieldChoice) => void,
})
{
    const modifyChoice = (index: number, newId: string) =>
    {
        props.setField({
            ...props.field,
            choices: [
                ...props.field.choices.slice(0, index),
                newId,
                ...props.field.choices.slice(index + 1),
            ],
        })
    }


    const addChoice = () =>
    {
        props.setField({
            ...props.field,
            choices: [
                ...props.field.choices,
                "choice_" + props.field.choices.length,
            ],
        })
    }


    const removeChoice = (index: number) =>
    {
        props.setField({
            ...props.field,
            choices: [
                ...props.field.choices.slice(0, index),
                ...props.field.choices.slice(index + 1),
            ],
        })
    }


    const moveChoice = (oldIndex: number, newIndex: number) =>
    {
        if (newIndex < 0 || newIndex > props.field.choices.length)
            return

        const withFieldRemoved = [
            ...props.field.choices.slice(0, oldIndex),
            ...props.field.choices.slice(oldIndex + 1),
        ]

        props.setField({
            ...props.field,
            choices: [
                ...withFieldRemoved.slice(0, newIndex),
                props.field.choices[oldIndex],
                ...withFieldRemoved.slice(newIndex),
            ],
        })
    }


    return <Tabulation>

        <UI.Grid template="auto 1fr">

            { props.field.choices.map((choice, i) =>
                <React.Fragment key={ i }>
                    <UI.Cell justifyEnd>
                        <UI.Button
                            label="❌"
                            onClick={ () => removeChoice(i) }
                        />
                        <UI.Button
                            label="🔼"
                            onClick={ () => moveChoice(i, i - 1) }
                        />
                        <UI.Button
                            label="🔽"
                            onClick={ () => moveChoice(i, i + 1) }
                        />
                    </UI.Cell>
                    <UI.Cell justifyStretch>
                        <UI.Input
                            value={ choice }
                            onChange={ (value) => modifyChoice(i, value) }
                            fullWidth
                        />
                    </UI.Cell>
                </React.Fragment>
            )}

            <UI.Cell span={2} justifyStart>
                <UI.Button
                    label="➕ Choice"
                    onClick={ addChoice }
                />
            </UI.Cell>

        </UI.Grid>

    </Tabulation>
}


export function FieldEnum(props: {
    field: Properties.DefFieldEnum,
    setField: (newValue: Properties.DefFieldEnum) => void,
})
{
    return <Tabulation>
        <FieldArray
            fields={ props.field.variants }
            setFields={ (newFields) => props.setField({ ...props.field, variants: newFields }) }
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