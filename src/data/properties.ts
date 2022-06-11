import * as ID from "./id"
import * as Defs from "./defs"
import * as MathUtils from "../util/mathUtils"


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


export interface DefFieldEnum extends DefFieldCommon
{
    type: "enum"
    choices: string[]
}


export interface DefFieldChoice extends DefFieldCommon
{
    type: "choice"
    choices: DefField[]
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
    FieldValueEnum |
    FieldValueChoice |
    FieldValueStruct |
    FieldValueList


export type FieldValuePoint = MathUtils.Point


export type FieldValueRect = MathUtils.RectWH


export type FieldValueEnum = string


export interface FieldValueChoice
{
    id: string
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

        case "enum": return {
            ...common,
            type: "enum",
            choices: ["variant_0"],
        }

        case "struct": return {
            ...common,
            type: "struct",
            fields: [makeDefFieldOfType("subfield_0", "string")],
        }

        case "choice": return {
            ...common,
            type: "choice",
            choices: [makeDefFieldOfType("choice_0", "string")],
        }

        case "list": return {
            ...common,
            type: "list",
            showPath: false,
            element: makeDefFieldOfType("subfield_0", "string"),
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

        case "enum":
            return ""

        case "struct":
        {
            const result: any = {}
            for (const subfield of field.fields)
                result[subfield.id] = makeDefaultValueOfField(subfield)

            return result
        }

        case "choice": return {
            id: field.choices[0].id,
            value: makeDefaultValueOfField(field.choices[0]),
        }

        case "list":
            return []

        default:
            throw "invalid field type"
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