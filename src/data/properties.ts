import * as ID from "./id"
import * as Defs from "./defs"
import * as MathUtils from "../util/mathUtils"


export type FieldFullId = (string | number)[]


export type DefProperties = DefField[]


export type DefField =
    DefFieldBool |
    DefFieldNumber |
    DefFieldString |
    DefFieldPoint |
    DefFieldRect |
    DefFieldEnum |
    DefFieldChoice |
    DefFieldStruct |
    DefFieldList


export interface DefFieldCommon
{
    id: string
    optional: boolean
    defaultValue: any
}


export interface DefFieldBool extends DefFieldCommon
{
    type: "bool"
    defaultValue: boolean
}


export interface DefFieldNumber extends DefFieldCommon
{
    type: "number"
    defaultValue: number
}


export interface DefFieldString extends DefFieldCommon
{
    type: "string"
    defaultValue: string
}


export interface DefFieldPoint extends DefFieldCommon
{
    type: "point"
    relative: boolean
    showGhost: boolean
}


export interface DefFieldRect extends DefFieldCommon
{
    type: "rect"
    relative: boolean
}


export interface DefFieldChoice extends DefFieldCommon
{
    type: "choice"
    choices: string[]
}


export interface DefFieldEnum extends DefFieldCommon
{
    type: "enum"
    variants: DefField[]
}


export interface DefFieldStruct extends DefFieldCommon
{
    type: "struct"
    fields: DefField[]
}


export interface DefFieldList extends DefFieldCommon
{
    type: "list"
    element: DefField
    showPath: boolean
}


export type PropertyValues = { [id: string]: FieldValue }


export type FieldValue = 
    null |
    boolean |
    number |
    string |
    FieldValuePoint |
    FieldValueRect |
    FieldValueChoice |
    FieldValueEnum |
    FieldValueStruct |
    FieldValueList


export type FieldValuePoint = MathUtils.Point


export type FieldValueRect = MathUtils.RectWH


export type FieldValueChoice = string


export interface FieldValueEnum
{
    variantId: string
    value: FieldValue
}


export type FieldValueStruct = PropertyValues


export type FieldValueList = FieldValue[]


export function makeDefFieldOfType(id: string, type: DefField["type"]): DefField
{
    const common: DefFieldCommon =
    {
        id,
        optional: false,
        defaultValue: null,
    }

    switch (type)
    {
        case "bool": return {
            ...common,
            type: "bool",
            defaultValue: false,
        }

        case "string": return {
            ...common,
            type: "string",
            defaultValue: "",
        }

        case "number": return {
            ...common,
            type: "number",
            defaultValue: 0,
        }

        case "point": return {
            ...common,
            type: "point",
            relative: false,
            showGhost: false,
        }

        case "rect": return {
            ...common,
            type: "rect",
            relative: false,
        }

        case "choice": return {
            ...common,
            type: "choice",
            choices: ["choice_0"],
        }

        case "struct": return {
            ...common,
            type: "struct",
            fields: [makeDefFieldOfType("subfield_0", "string")],
        }

        case "enum": return {
            ...common,
            type: "enum",
            variants: [makeDefFieldOfType("variant_0", "string")],
        }

        case "list": return {
            ...common,
            type: "list",
            showPath: false,
            element: makeDefFieldOfType("element", "string"),
        }

        default:
            throw "invalid field type"
    }
}


export function makeDefaultValueOfField(field: DefField): FieldValue
{
    switch (field.type)
    {
        case "bool":
            return field.defaultValue

        case "string":
            return field.defaultValue

        case "number":
            return field.defaultValue

        case "point":
            return { x: 0, y: 0 }

        case "rect":
            return { x: 0, y: 0, width: 0, height: 0 }

        case "choice":
            return field.choices[0] ?? null

        case "struct":
        {
            const result: any = {}
            for (const subfield of field.fields)
                result[subfield.id] = makeNewValue(subfield)

            return result
        }

        case "enum": return field.variants.length == 0 ? null : {
            variantId: field.variants[0].id,
            value: makeNewValue(field.variants[0]),
        }

        case "list":
            return []

        default:
            throw "invalid field type"
    }
}


export function makeNewValue(field: DefField): FieldValue
{
    if (field.optional)
        return null

    return makeDefaultValueOfField(field)
}


export function makeNewValues(defs: DefProperties): PropertyValues
{
    const result: PropertyValues = {}

    for (const field of defs)
    {
        result[field.id] = makeDefaultValueOfField(field)
    }

    return result
}


export function getValueByFullId(
    value: FieldValue,
    fullId: FieldFullId)
    : FieldValue
{
    if (value === null || value === undefined)
        return null
    
    if (fullId.length == 0)
        return value
    
    if (typeof fullId[0] === "string")
        return getValueByFullId((value as FieldValueStruct)[fullId[0]], fullId.slice(1))
        
    else
        return getValueByFullId((value as FieldValueList)[fullId[0]], fullId.slice(1))
}


export function setValueByFullId(
    value: FieldValue,
    fullId: FieldFullId,
    newValue: FieldValue)
    : FieldValue
{
    if (fullId.length == 0)
        return newValue
    
    if (value === null || value === undefined)
        return value
    
    if (typeof fullId[0] === "string")
    {
        const valueStruct = value as FieldValueStruct
        return {
            ...valueStruct,
            [fullId[0]]: setValueByFullId(
                valueStruct[fullId[0]],
                fullId.slice(1),
                newValue),
        }
    }
    else 
    {
        const valueList = value as FieldValueList
        return [
            ...valueList.slice(0, fullId[0]),
            setValueByFullId(
                valueList[fullId[0]],
                fullId.slice(1),
                newValue),
            ...valueList.slice(fullId[0] + 1),
        ]
    }
}


export function deleteValueFromListByFullId(
    value: FieldValue,
    fullId: FieldFullId)
    : FieldValue
{
    if (fullId.length == 0)
        return value
    
    if (value === null || value === undefined)
        return value
    
    if (typeof fullId[0] === "string")
    {
        const valueStruct = value as FieldValueStruct
        return {
            ...valueStruct,
            [fullId[0]]: deleteValueFromListByFullId(
                valueStruct[fullId[0]],
                fullId.slice(1)),
        }
    }
    else 
    {
        const valueList = value as FieldValueList
        return [
            ...valueList.slice(0, fullId[0]),
            ...valueList.slice(fullId[0] + 1),
        ]
    }
}


export function duplicateValueFromListByFullId(
    value: FieldValue,
    fullId: FieldFullId,
    before: boolean)
    : [FieldValue, FieldFullId]
{
    if (fullId.length == 0)
        return [value, fullId]
    
    if (value === null || value === undefined)
        return [value, fullId]
    
    if (typeof fullId[0] === "string")
    {
        const valueStruct = value as FieldValueStruct

        const [newValue, newFullId] = duplicateValueFromListByFullId(
            valueStruct[fullId[0]],
            fullId.slice(1),
            before)

        return [
            { ...valueStruct, [fullId[0]]: newValue },
            [fullId[0], ...newFullId]
        ]
    }
    else 
    {
        const valueList = value as FieldValueList

        if (before)
        {
            return [
                [
                    ...valueList.slice(0, fullId[0]),
                    valueList[fullId[0]],
                    ...valueList.slice(fullId[0]),
                ],
                fullId
            ]
        }
        else
        {
            return [
                [
                    ...valueList.slice(0, fullId[0] + 1),
                    valueList[fullId[0]],
                    ...valueList.slice(fullId[0] + 1),
                ],
                [fullId[0] + 1, ...fullId.slice(1)]
            ]
        }
    }
}


export function getDefsIntersection(defs: DefProperties[]): DefProperties
{
    if (defs.length == 1)
        return defs[0]
    
    const result: DefProperties = []

    for (let aField = 0; aField < defs.length; aField++)
    {
        const field = defs[0][aField]

        const existsOnAll = defs.every(def =>
            def.find(f => f.id === field.id && f.type === field.type && f.optional === field.optional))

        if (existsOnAll)
        {
            result.push(field)
        }
    }

    return result
}