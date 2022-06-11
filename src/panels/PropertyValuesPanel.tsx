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
    properties: Properties.PropertyValues[],
    setProperties: (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) => void,
})
{
    const set = (id: string, value: Properties.FieldValue) =>
    {
        props.setProperties((old) =>
        {
            return {
                ...old,
                [id]: value,
            }
        })
    }


    return <UI.Grid template="auto auto 1fr">

        { props.defProperties.map(field =>
            <Field
                key={ field.id }
                field={ field }
                values={ props.properties.map(p => p[field.id]) }
                setProperties={ props.setProperties }
            />
        )}

    </UI.Grid>
}


export function Field<T extends Properties.DefField>(props: {
    field: T,
    values: Properties.FieldValue[],
    setProperties: (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) => void,
})
{
    let Elem: any = () => <div/>

    switch (props.field.type)
    {
        case "bool":
            Elem = FieldBool
            break

        case "string":
            Elem = FieldString
            break

        case "number":
            Elem = FieldNumber
            break

        case "point":
            Elem = FieldPoint
            break

        case "struct":
            Elem = FieldStruct
            break
    }

    const enabled = props.values.reduce<boolean>(
        (accum, x) => (x !== null) == accum ? accum : true,
        props.values[0] !== null)

    const modify = (newValue: Properties.FieldValue) =>
        props.setProperties(old => ({ ...old, [props.field.id]: newValue }))

    return <>
        <UI.Cell justifyEnd>
            { props.field.id }
        </UI.Cell>
        
        <UI.Cell justifyStart>
            { props.field.optional &&
                <UI.Checkbox
                    value={ enabled }
                    onChange={ (enable) => modify(enable ? Properties.makeDefaultValueOfField(props.field) : null) }
                />
            }
        </UI.Cell>

        <Elem
            field={ props.field }
            enabled={ enabled }
            values={ props.values }
            setProperties={ props.setProperties }
        />
    </>
}


export function FieldBool(props: {
    field: Properties.DefFieldBool,
    enabled: boolean,
    values: Properties.FieldValue[],
    setProperties: (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) => void,
})
{
    const value = props.values.reduce<boolean | null>(
        (accum, x) => x !== null && x == accum ? accum : null,
        props.values[0] as boolean)

    const modify = (newValue: boolean) =>
        props.setProperties(old => ({ ...old, [props.field.id]: newValue }))

    return <>
        <UI.Cell justifyStart>
            <UI.Checkbox
                value={ !!value }
                onChange={ modify }
                disabled={ !props.enabled }
            />
            { props.enabled && value === null &&
                <span style={{ color: "#606060", marginLeft: "1em" }}>
                    - multiple values -
                </span>
            }
        </UI.Cell>
    </>
}


export function FieldString(props: {
    field: Properties.DefFieldString,
    enabled: boolean,
    values: Properties.FieldValue[],
    setProperties: (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) => void,
})
{
    const value = props.values.reduce<string | null>(
        (accum, x) => x !== null && x == accum ? accum : null,
        props.values[0] as string)

    const modify = (newValue: string) =>
        props.setProperties(old => ({ ...old, [props.field.id]: newValue }))

    return <>
        <UI.Cell justifyStretch>
            <UI.Input
                value={ !props.enabled ? " " : value ?? "" }
                placeholder={ value === null ? "- multiple values -" : "" }
                onChange={ modify }
                disabled={ !props.enabled }
                fullWidth
            />
        </UI.Cell>
    </>
}


export function FieldNumber(props: {
    field: Properties.DefFieldNumber,
    enabled: boolean,
    values: Properties.FieldValue[],
    setProperties: (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) => void,
})
{
    const value = props.values.reduce<number | null>(
        (accum, x) => x !== null && x == accum ? accum : null,
        props.values[0] as number)

    const modify = (newValue: number) =>
        props.setProperties(old => ({ ...old, [props.field.id]: newValue }))

    return <>
        <UI.Cell justifyStretch>
            <UI.Input
                number
                value={ !props.enabled ? " " : value ?? "" }
                placeholder={ value === null ? "- multiple values -" : "" }
                onChangeNumber={ modify }
                disabled={ !props.enabled }
                fullWidth
            />
        </UI.Cell>
    </>
}


export function FieldPoint(props: {
    field: Properties.DefFieldPoint,
    enabled: boolean,
    values: Properties.FieldValue[],
    setProperties: (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) => void,
})
{
    const valueX = props.values.reduce<number | null>(
        (accum, x) =>
        {
            const value = (x as Properties.FieldValuePoint)?.x ?? null
            return value !== null && value == accum ? accum : null
        },
        (props.values[0] as Properties.FieldValuePoint)?.x ?? null)

    const valueY = props.values.reduce<number | null>(
        (accum, x) =>
        {
            const value = (x as Properties.FieldValuePoint)?.y ?? null
            return value !== null && value == accum ? accum : null
        },
        (props.values[0] as Properties.FieldValuePoint)?.y ?? null)
        
    const modifyX = (newValue: number) =>
        props.setProperties(old => ({ ...old, [props.field.id]: { ...old[props.field.id] as any, x: newValue }}))

    const modifyY = (newValue: number) =>
        props.setProperties(old => ({ ...old, [props.field.id]: { ...old[props.field.id] as any, y: newValue }}))

    return <>
        <UI.Cell justifyStart>
            <UI.Input
                number
                value={ !props.enabled ? " " : valueX ?? "" }
                placeholder={ valueX === null ? "- multiple values -" : "" }
                onChangeNumber={ modifyX }
                disabled={ !props.enabled }
            />
            { " × " }
            <UI.Input
                number
                value={ !props.enabled ? " " : valueY ?? "" }
                placeholder={ valueY === null ? "- multiple values -" : "" }
                onChangeNumber={ modifyY }
                disabled={ !props.enabled }
            />
        </UI.Cell>
    </>
}


export function FieldStruct(props: {
    field: Properties.DefFieldStruct,
    enabled: boolean,
    values: Properties.FieldValueStruct[],
    setProperties: (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) => void,
})
{
    const modify = (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) =>
    {
        props.setProperties((old) =>
        {
            return {
                ...old,
                [props.field.id]:
                    modifyFn(old[props.field.id] as Properties.FieldValueStruct),
            }
        })
    }

    return <>
        <div/>

        { props.enabled &&
            <UI.Cell span={ 3 }>
        
                <UI.Grid template="auto auto 1fr" style={{
                    paddingLeft: "1em",
                    paddingBottom: "0.5em",
                    borderLeft: "4px solid #2d2d2d",
                    borderBottom: "4px solid #2d2d2d",
                    borderBottomLeftRadius: "1em",
                }}>

                    { props.field.fields.map(field =>
                        <Field
                            key={ field.id }
                            field={ field }
                            values={ props.values.map(p => p?.[field.id]) }
                            setProperties={ (newValue) => modify(newValue) }
                        />
                    )}

                </UI.Grid>
            
            </UI.Cell>
        }
    </>
}