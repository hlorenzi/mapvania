import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as Filesystem from "../data/filesystem"
import * as Hierarchy from "../data/hierarchy"
import * as ID from "../data/id"
import * as Images from "../data/images"
import * as UI from "../ui"


export function ModalBuiltinImagePicker(props: {
    open: boolean,
    setOpen: (open: boolean) => void,
    imageset: Images.BuiltinImageItem[],
    header?: string,
    value: ID.ID,
    onChange?: (newValue: ID.ID) => void,
})
{
    const onChangeInner = (id: ID.ID) =>
    {
        if (id.startsWith(Hierarchy.FOLDER_ID_PREFIX))
            return

        props.onChange?.(id)
    }


    const options = Images.decodeBuiltinImagePath(props.value) ??
    {
        id: "",
        color: { r: 255, g: 255, b: 255, a: 255 },
        bkgColor: { r: 0, g: 0, b: 0, a: 0 },
    }
    

    const setId = (id: string) =>
    {
        onChangeInner(Images.encodeBuiltinImagePath({
            ...options,
            id,
        }))
    }
    

    const setColor = (hex: string) =>
    {
        onChangeInner(Images.encodeBuiltinImagePath({
            ...options,
            color: Images.colorHexToRgb(hex),
        }))
    }
    

    const setBkgColor = (hex: string) =>
    {
        onChangeInner(Images.encodeBuiltinImagePath({
            ...options,
            bkgColor: Images.colorHexToRgb(hex),
        }))
    }


    return <UI.Modal
        open={ props.open }
        setOpen={ props.setOpen }
    >
        <UI.HeaderAndBody
            header={ props.header ?? "Select a built-in image" }
        >

            <UI.Grid template="auto auto">

                <UI.Cell justifyEnd>
                    Tint color
                </UI.Cell>

                <UI.Cell justifyStart>
                    <UI.InputColor
                        value={ Images.colorRgbToHex(options.color) }
                        onChange={ setColor }
                        fullWidth
                    />

                    <br/>

                    { Images.standardTintColors.map(hex =>
                        <UI.Button
                            key={ hex }
                            label={ hex }
                            onClick={ () => setColor(hex) }
                        >
                            <div style={{
                                backgroundColor: hex,
                                width: "1em",
                                height: "1em",
                                border: "1px solid #fff",
                            }}/>
                        </UI.Button>
                    )}

                </UI.Cell>

                <UI.Cell justifyEnd>
                    Background color
                </UI.Cell>

                <UI.Cell justifyStart>
                    <UI.InputColor
                        value={ Images.colorRgbToHex(options.bkgColor) }
                        onChange={ setBkgColor }
                        fullWidth
                    />

                    <br/>

                    { Images.standardBkgColors.map(hex =>
                        <UI.Button
                            key={ hex }
                            label={ hex }
                            onClick={ () => setBkgColor(hex) }
                        >
                            <div style={{
                                backgroundColor: hex,
                                width: "1em",
                                height: "1em",
                                border: "1px solid #fff",
                            }}/>
                        </UI.Button>
                    )}

                </UI.Cell>

                <UI.Cell span={ 2 }>
                    <UI.HierarchicalList<Images.BuiltinImageItem>
                        is2D
                        items={ props.imageset }
                        value={ options.id }
                        onChange={ setId }
                        getItemIcon={ item => Defs.getImageIconElement("", Filesystem.BUILTIN_IMAGE_PREFIX + item.id) }
                        getItemLabel={ item => item.name }
                        style={{
                            width: "30em",
                            height: "60vh",
                    }}/>
                </UI.Cell>

            </UI.Grid>

        </UI.HeaderAndBody>

    </UI.Modal>
}