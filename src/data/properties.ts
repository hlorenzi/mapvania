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
    DefFieldOptional |
    DefFieldEnum |
    DefFieldChoice |
    DefFieldStruct |
    DefFieldList


export interface DefFieldCommon
{
    id: string
}


export interface DefFieldBool extends DefFieldCommon
{
    type: "bool"
}


export interface DefFieldNumber extends DefFieldCommon
{
    type: "number"
}


export interface DefFieldString extends DefFieldCommon
{
    type: "string"
}


export interface DefFieldPoint extends DefFieldCommon
{
    type: "point"
}


export interface DefFieldRect extends DefFieldCommon
{
    type: "rect"
}


export interface DefFieldEnum extends DefFieldCommon
{
    type: "enum"
    choices: string[]
}


export interface DefFieldOptional extends DefFieldCommon
{
    type: "optional"
    field: DefField
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
}


export type Properties = { [id: string]: FieldValue }


export type FieldValue = 
    boolean |
    number |
    string |
    MathUtils.Point |
    MathUtils.RectWH |
    string[] |
    FieldValueChoice |
    Properties


export interface FieldValueChoice
{
    id: string
    value: FieldValue
}


export function makeDefFieldOfType(id: string, type: DefField["type"]): DefField
{
    switch (type)
    {
        case "bool": return {
            id,
            type: "bool",
        }

        case "string": return {
            id,
            type: "string",
        }

        case "number": return {
            id,
            type: "number",
        }

        case "point": return {
            id,
            type: "point",
        }

        case "rect": return {
            id,
            type: "rect",
        }

        case "optional": return {
            id,
            type: "optional",
            field: makeDefFieldOfType("inner", "string")
        }

        case "struct": return {
            id,
            type: "struct",
            fields: [],
        }

        default:
            throw "invalid field type"
    }
}