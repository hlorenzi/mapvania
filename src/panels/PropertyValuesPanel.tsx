import * as React from "react"
import CodeEditor from "react-simple-code-editor"
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
    const modify = (fieldId: string, modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) =>
        props.setProperties(old =>
        {
            return {
                ...old,
                [fieldId]:
                    modifyFn(old[fieldId])
            }
        })


    return <UI.Grid template="auto auto auto 1fr">

        { props.defProperties.map(field =>
            <Field
                key={ field.id }
                field={ field }
                values={ props.properties.map(p => p[field.id]) }
                modifyValue={ (newValue) => modify(field.id, newValue) }
            />
        )}

    </UI.Grid>
}


export function Field<T extends Properties.DefField>(props: {
    field: T,
    values: Properties.FieldValue[],
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
    removeField?: () => void,
    moveFieldUp?: () => void,
    moveFieldDown?: () => void,
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

        case "rect":
            Elem = FieldRect
            break

        case "choice":
            Elem = FieldChoice
            break

        case "struct":
            Elem = FieldStruct
            break

        case "enum":
            Elem = FieldEnum
            break

        case "list":
            Elem = FieldList
            break
    }

    const enabled = props.values.reduce<boolean>(
        (accum, x) => (x !== null) == accum ? accum : true,
        props.values[0] !== null)

    const modify = (newValue: Properties.FieldValue) =>
        props.modifyValue(old => newValue)

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

        <UI.Cell justifyEnd>
            { props.field.id }

            { !("color" in props.field) ? null :
                <div style={{
                    marginLeft: "0.5em",
                    display: "inline-block",
                    width: "1em",
                    height: "1em",
                    backgroundColor: props.field.color,
                    border: "1px solid #ffffff",
                }}/>
            }
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
            modifyValue={ props.modifyValue }
        />
    </>
}


export function FieldBool(props: {
    field: Properties.DefFieldBool,
    enabled: boolean,
    values: Properties.FieldValue[],
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
})
{
    const value = props.values.reduce<boolean | null>(
        (accum, x) => x !== null && x == accum ? accum : null,
        props.values[0] as boolean)

    const modify = (newValue: boolean) =>
        props.modifyValue(old => newValue)

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
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
})
{
    const value = props.values.reduce<string | null>(
        (accum, x) => x !== null && x == accum ? accum : null,
        props.values[0] as string)

    const hasNewlines = !value ? false : value.indexOf("\n") >= 0

    const [codeEditorOpen, setCodeEditorOpen] = React.useState(hasNewlines)

    const modify = (newValue: string) =>
        props.modifyValue(old => newValue)


    return <>
        { !codeEditorOpen ?
            <UI.Cell justifyStretch>
                <div style={{
                    display: "grid",
                    gridTemplate: "auto / 1fr auto",
                    width: "100%",
                }}>
                    <UI.Input
                        value={ !props.enabled ? " " : value ?? "" }
                        placeholder={ value === null ? "- multiple values -" : "" }
                        onChange={ modify }
                        disabled={ !props.enabled || hasNewlines }
                        fullWidth
                    />

                    <UI.Button
                        label="⏬"
                        onClick={ () => setCodeEditorOpen(o => !o) }
                    />
                </div>
            </UI.Cell>
        :
            <>
                <UI.Cell justifyEnd>
                    <UI.Button
                        label="⏫"
                        onClick={ () => setCodeEditorOpen(o => !o) }
                    />
                </UI.Cell>
                <UI.Cell span={ 4 } justifyStretch>
                    <div style={{
                        width: "100%",
                        maxHeight: "50vh",
                        overflowY: "auto",
                    }}>
                        <CodeEditor
                            value={ !props.enabled ? " " : value ?? "" }
                            placeholder={ value === null ? "- multiple values -" : "" }
                            onValueChange={ modify }
                            highlight={ c => c }
                            disabled={ !props.enabled }
                            padding={ 6 }
                            style={{
                                border: 0,
                                backgroundColor: "#2d2d2d",
                                fontFamily: "monospace",
                                fontSize: "1.2em",
                                lineHeight: "1.35em",
                        }}/>
                    </div>
                </UI.Cell>
            </>
        }
    </>
}


export function FieldNumber(props: {
    field: Properties.DefFieldNumber,
    enabled: boolean,
    values: Properties.FieldValue[],
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
})
{
    const value = props.values.reduce<number | null>(
        (accum, x) => x !== null && x == accum ? accum : null,
        props.values[0] as number)

    const modify = (newValue: number) =>
        props.modifyValue(old => newValue)

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
    values: Properties.FieldValuePoint[],
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
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
        props.modifyValue(old =>
        {
            const oldPoint = old as Properties.FieldValuePoint

            return {
                ...oldPoint,
                x: newValue,
            }
        })

    const modifyY = (newValue: number) =>
        props.modifyValue(old =>
        {
            const oldPoint = old as Properties.FieldValuePoint

            return {
                ...oldPoint,
                y: newValue,
            }
        })

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


export function FieldRect(props: {
    field: Properties.DefFieldRect,
    enabled: boolean,
    values: Properties.FieldValueRect[],
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
})
{
    const valueX = props.values.reduce<number | null>(
        (accum, x) =>
        {
            const value = (x as Properties.FieldValueRect)?.x ?? null
            return value !== null && value == accum ? accum : null
        },
        (props.values[0] as Properties.FieldValueRect)?.x ?? null)

    const valueY = props.values.reduce<number | null>(
        (accum, x) =>
        {
            const value = (x as Properties.FieldValueRect)?.y ?? null
            return value !== null && value == accum ? accum : null
        },
        (props.values[0] as Properties.FieldValueRect)?.y ?? null)
        
    const valueW = props.values.reduce<number | null>(
        (accum, x) =>
        {
            const value = (x as Properties.FieldValueRect)?.width ?? null
            return value !== null && value == accum ? accum : null
        },
        (props.values[0] as Properties.FieldValueRect)?.width ?? null)
        
    const valueH = props.values.reduce<number | null>(
        (accum, x) =>
        {
            const value = (x as Properties.FieldValueRect)?.height ?? null
            return value !== null && value == accum ? accum : null
        },
        (props.values[0] as Properties.FieldValueRect)?.height ?? null)
        
    const modifyX = (newValue: number) =>
        props.modifyValue(old =>
        {
            const oldRect = old as Properties.FieldValueRect

            return {
                ...oldRect,
                x: newValue,
            }
        })

    const modifyY = (newValue: number) =>
        props.modifyValue(old =>
        {
            const oldRect = old as Properties.FieldValueRect

            return {
                ...oldRect,
                y: newValue,
            }
        })

    const modifyW = (newValue: number) =>
        props.modifyValue(old =>
        {
            const oldRect = old as Properties.FieldValueRect

            return {
                ...oldRect,
                width: newValue,
            }
        })

    const modifyH = (newValue: number) =>
        props.modifyValue(old =>
        {
            const oldRect = old as Properties.FieldValueRect

            return {
                ...oldRect,
                height: newValue,
            }
        })

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
            <br/>
            <UI.Input
                number
                value={ !props.enabled ? " " : valueW ?? "" }
                placeholder={ valueW === null ? "- multiple values -" : "" }
                onChangeNumber={ modifyW }
                disabled={ !props.enabled }
            />
            { " × " }
            <UI.Input
                number
                value={ !props.enabled ? " " : valueH ?? "" }
                placeholder={ valueH === null ? "- multiple values -" : "" }
                onChangeNumber={ modifyH }
                disabled={ !props.enabled }
            />
        </UI.Cell>

    </>
}


export function FieldChoice(props: {
    field: Properties.DefFieldChoice,
    enabled: boolean,
    values: Properties.FieldValueChoice[],
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
})
{
    const value = props.values.reduce<string | null>(
        (accum, x) => x !== null && x == accum ? accum : null,
        props.values[0] as Properties.FieldValueChoice)

    const modify = (newValue: string) =>
        props.modifyValue(old => newValue)

    return <>
        <UI.Cell justifyStretch>
            <UI.Select
                value={ !props.enabled ? "" : value ?? "" }
                onChange={ modify }
                disabled={ !props.enabled }
            >
                { props.field.choices.map((choice, i) =>
                    <option
                        key={ i }
                        value={ choice }
                    >
                        { choice }
                    </option>
                )}
            </UI.Select>
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
        }}>
            <UI.Grid template="auto auto auto 1fr">
                { props.children }
            </UI.Grid>
        </div>
    </UI.Cell>
}


export function FieldStruct(props: {
    field: Properties.DefFieldStruct,
    enabled: boolean,
    values: Properties.FieldValueStruct[],
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
})
{
    const modify = (fieldId: string, modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) =>
    {
        props.modifyValue((old) =>
        {
            const oldStruct = old as Properties.FieldValueStruct

            return {
                ...oldStruct,
                [fieldId]:
                    modifyFn(oldStruct[fieldId]),
            }
        })
    }

    return <>
        <div/>

        { props.enabled &&
            <Tabulation>
        
                { props.field.fields.map(field =>
                    <Field
                        key={ field.id }
                        field={ field }
                        values={ props.values.map(p => p?.[field.id]) }
                        modifyValue={ (newValue) => modify(field.id, newValue) }
                    />
                )}
            
            </Tabulation>
        }
    </>
}


export function FieldEnum(props: {
    field: Properties.DefFieldEnum,
    enabled: boolean,
    values: Properties.FieldValueEnum[],
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
})
{
    const variant = props.values.reduce<string | null>(
        (accum, x) =>
        {
            const value = (x as Properties.FieldValueEnum)?.variantId ?? null
            return value !== null && value == accum ? accum : null
        },
        (props.values[0] as Properties.FieldValueEnum)?.variantId ?? null)
        
    const modifyVariantId = (newVariantId: string) =>
        props.modifyValue(old =>
        {
            return {
                variantId: newVariantId,
                value: Properties.makeNewValue(
                    props.field.variants.find(v => v.id === newVariantId)!),
            }
        })

    const modify = (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) =>
    {
        props.modifyValue((old) =>
        {
            const oldStruct = old as Properties.FieldValueEnum

            return {
                ...oldStruct,
                value:
                    modifyFn(oldStruct.value),
            }
        })
    }

    return <>
        <UI.Cell justifyStretch>
            <UI.Select
                value={ !props.enabled ? "" : variant ?? "" }
                onChange={ modifyVariantId }
                disabled={ !props.enabled }
            >
                { props.field.variants.map((choice, i) =>
                    <option
                        key={ i }
                        value={ choice.id }
                    >
                        { choice.id }
                    </option>
                )}
            </UI.Select>
        </UI.Cell>

        { props.enabled && !!variant &&
            <Tabulation>
                <Field
                    field={ props.field.variants.find(v => v.id === variant)! }
                    modifyValue={ modify }
                    values={ props.values.map(v => v.value) }
                />
            </Tabulation>
        }
    </>
}


export function FieldList(props: {
    field: Properties.DefFieldList,
    enabled: boolean,
    values: Properties.FieldValueList[],
    modifyValue: (modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) => void,
})
{
    const [refresh, setRefresh] = React.useState(0)

    const length = props.values.reduce<number | null>(
        (accum, x) =>
        {
            const value = (x as Properties.FieldValueList)?.length ?? null
            return value !== null && value == accum ? accum : null
        },
        (props.values[0] as Properties.FieldValueList)?.length ?? null)


    const modify = (index: number, modifyFn: (value: Properties.FieldValue) => Properties.FieldValue) =>
    {
        props.modifyValue(old =>
        {
            const oldList = old as Properties.FieldValueList

            return [
                ...oldList.slice(0, index),
                modifyFn(oldList[index]),
                ...oldList.slice(index + 1),
            ]
        })
    }


    const createElement = () =>
    {
        props.modifyValue(old =>
        {
            const oldList = old as Properties.FieldValueList

            return [
                ...oldList,
                Properties.makeNewValue(props.field.element),
            ]
        })
    }


    const removeElement = (index: number) =>
    {
        props.modifyValue(old =>
        {
            const oldList = old as Properties.FieldValueList

            return [
                ...oldList.slice(0, index),
                ...oldList.slice(index + 1),
            ]
        })
    }


    const moveElement = (oldIndex: number, newIndex: number) =>
    {
        props.modifyValue(old =>
        {
            const oldList = old as Properties.FieldValueList

            if (newIndex < 0 || newIndex > oldList.length)
                return oldList

            const withFieldRemoved = [
                ...oldList.slice(0, oldIndex),
                ...oldList.slice(oldIndex + 1),
            ]

            return [
                ...withFieldRemoved.slice(0, newIndex),
                oldList[oldIndex],
                ...withFieldRemoved.slice(newIndex),
            ]
        })

        setRefresh(r => r + 1)
    }


    return <>
        <Tabulation key={ length + "_" + refresh }>

            { length !== null ?
                <>
                    { props.values[0].map((element, i) =>
                        <Field
                            key={ i }
                            field={ props.field.element }
                            values={ props.values.map(p => p?.[i]) }
                            modifyValue={ (newValue) => modify(i, newValue) }
                            removeField={ () => removeElement(i) }
                            moveFieldUp={ () => moveElement(i, i - 1) }
                            moveFieldDown={ () => moveElement(i, i + 1) }
                        />
                    )}

                    <UI.Cell span={4} justifyStart>
                        <UI.Button
                            label="➕ Element"
                            onClick={ createElement }
                        />
                    </UI.Cell>

                </>
            :
                <UI.Cell span={4} justifyStart>
                    <span style={{ color: "#606060" }}>
                        - multiple list lengths -
                    </span>
                </UI.Cell>
            }
        
        </Tabulation>
    </>
}