import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Filesystem from "../data/filesystem"
import * as Editors from "../data/editors"
import * as Images from "../data/images"
import * as ID from "../data/id"
import * as UI from "../ui"
import { ModalBuiltinImagePicker } from "./ModalBuiltinImagePicker"


export function InputImagePicker(props: {
    value: string,
    onChange?: (newValue: string, image: Images.Image) => void,
    imageset: Images.BuiltinImageItem[],
    basePath: string,
    header?: string,
    placeholder?: string,
})
{
    const [open, setOpen] = React.useState(false)


    let displayName = props.value
    if (props.value.startsWith(Filesystem.BUILTIN_IMAGE_PREFIX))
    {
        const decode = Images.decodeBuiltinImagePath(props.value)
        if (decode)
            displayName =
                Images.builtinObjectImages.find(i => i.id === decode.id)?.name ??
                decode.id
    }

    
    const chooseFile = async () =>
    {
        const imageRelativePath = await Filesystem.showImagePicker(
            props.basePath)

        if (!imageRelativePath)
            return

        const imageRootPath = Filesystem.resolveRelativePath(
            props.basePath,
            imageRelativePath)

        const image = await Images.loadImage(imageRootPath)
        if (!image)
            return

        props.onChange?.(imageRelativePath, image)
    }


    const chooseBuiltin = async (builtinPath: string) =>
    {
        const image = await Images.loadImage(builtinPath)
        if (!image)
            return

        props.onChange?.(builtinPath, image)
    }


    return <div style={{
        display: "grid",
        gridTemplate: "3em / 3fr 1fr",
        gap: "0.5em",
        alignItems: "center",
    }}>
        
        <UI.Button
            title="Click to choose..."
            onClick={ chooseFile }
            backgroundColor="#111111"
            style={{
                width: "100%",
                height: "3em",
                overflow: "hidden",
        }}>
            <div style={{
                width: "100%",
                height: "100%",
                display: "grid",
                overflow: "hidden",
                gridTemplate: "1fr / 3em 1fr",
                alignItems: "center",
                justifyItems: "start",
                gap: "0.5em",
            }}>
                <div style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    overflow: "hidden",
                    justifySelf: "center",
                }}>
                    { Defs.getImageIconElement(props.basePath, props.value) }
                </div>

                <div>
                    { displayName ||
                        <span style={{
                            fontStyle: "italic",
                            opacity: 0.75,
                        }}>
                            Choose image file...
                        </span>
                    }
                </div>
            </div>
        </UI.Button>

        <UI.Button
            label={ <>
                Choose<br/>
                built-in...
            </>}
            onClick={ () => setOpen(true) }
            fullWidth
        />
        
        <ModalBuiltinImagePicker
            open={ open }
            setOpen={ setOpen }
            imageset={ props.imageset }
            header={ props.header }
            value={ props.value }
            onChange={ chooseBuiltin }
        />
    </div>
}