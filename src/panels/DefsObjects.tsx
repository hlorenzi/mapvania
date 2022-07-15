import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Filesystem from "../data/filesystem"
import * as Editors from "../data/editors"
import * as Images from "../data/images"
import * as Hierarchy from "../data/hierarchy"
import * as UI from "../ui"
import { global } from "../global"
import { PropertyDefsPanel } from "./PropertyDefsPanel"
import styled from "styled-components"
import { DeepAssignable } from "../util/deepAssign"
import { useCachedState } from "../util/useCachedState"
import { ObjectInheritanceList } from "./ObjectInheritanceList"


export function DefsObjects(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs
    const set = (newDefs: Defs.Defs) =>
    {
        global.editors.editors[props.editorIndex].defs = newDefs
        global.editors.refreshToken.commit()
    }

    const modify = (newDefs: DeepAssignable<Defs.Defs>) =>
    {
        Editors.deepAssignEditor(props.editorIndex, {
            defs: newDefs,
        })
    }

    const [listState, setListState] = useCachedState("DefsObjectsListState", UI.makeHierarchicalListState())
    const curObjectId = listState.lastSelectedId
    const curObjectIndex = defs.objectDefs.findIndex(o => o.id === curObjectId)
    const curObject = defs.objectDefs.find(o => o.id === curObjectId)
    const curObjectImg = Images.getImageLazy(curObject?.imageSrc ?? "")
    const [curTab, setCurTab] = React.useState(0)


    const setObject = (objectDef: Defs.DefObject) =>
    {
        if (curObjectIndex < 0)
            return

        set({
            ...defs,
            objectDefs: [
                ...defs.objectDefs.slice(0, curObjectIndex),
                objectDef,
                ...defs.objectDefs.slice(curObjectIndex + 1),
            ],
        })
    }


    const modifyObject = (objectDef: DeepAssignable<Defs.DefObject>) =>
    {
        if (curObjectIndex < 0)
            return

        modify({ objectDefs: { [curObjectIndex]: objectDef }})
    }


    const create = () =>
    {
        const [newNextIDs, newID] = ID.getNextID(defs.nextIDs)

        const objectDef = Defs.makeNewObjectDef()
        objectDef.id = newID
        objectDef.name = "object_" + newID

        modify(
        {
            nextIDs: newNextIDs,
        })

        return objectDef
    }


    const loadImage = async () =>
    {
        const imageRootRelativePath = await Filesystem.showImagePicker()
        if (!imageRootRelativePath)
            return

        const image = await Images.loadImage(imageRootRelativePath)
        if (!image)
            return

        modify(
        {
            objectDefs: { [curObjectIndex]: {
                imageSrc: imageRootRelativePath,
                imageRect: {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                },
                interactionRect: {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                },
            } },
        })
    }


    const renderPreview = React.useMemo(() => (ctx: CanvasRenderingContext2D) =>
    {
        if (!curObject || !curObjectImg)
            return

        ctx.save()
            ctx.beginPath()
            ctx.rect(
                0,
                0,
                curObjectImg.width,
                curObject.imageRect.y)
            ctx.rect(
                0,
                curObject.imageRect.y + curObject.imageRect.height,
                curObjectImg.width,
                curObjectImg.height)
            ctx.rect(
                0,
                0,
                curObject.imageRect.x,
                curObjectImg.height)
            ctx.rect(
                curObject.imageRect.x + curObject.imageRect.width,
                0,
                curObjectImg.width,
                curObjectImg.height)
            ctx.clip()

            ctx.fillStyle = "#000c"
            ctx.fillRect(0, 0, curObjectImg.width, curObjectImg.height)
        ctx.restore()

        ctx.strokeStyle = "#fff"
        ctx.strokeRect(
            curObject.imageRect.x,
            curObject.imageRect.y,
            curObject.imageRect.width,
            curObject.imageRect.height)

        ctx.translate(
            curObject.imageRect.x,
            curObject.imageRect.y)

        ctx.strokeStyle = "#0c0"
        ctx.strokeRect(
            curObject.interactionRect.x,
            curObject.interactionRect.y,
            curObject.interactionRect.width,
            curObject.interactionRect.height)

        const pivotSize = 2

        const pivotX =
            curObject.interactionRect.x +
            curObject.interactionRect.width * curObject.pivotPercent.x

        const pivotY =
            curObject.interactionRect.y +
            curObject.interactionRect.height * curObject.pivotPercent.y

        ctx.fillStyle = "#ff0"
        ctx.fillRect(
            pivotX - pivotSize,
            pivotY - pivotSize,
            pivotSize + pivotSize,
            pivotSize + pivotSize)

    }, [curObject, curObjectImg])


    return <UI.Grid template="15em 30em 1fr" templateRows="1fr" fullHeight alignStart>

        <UI.HierarchicalList<Defs.DefObject>
            items={ defs.objectDefs }
            setItems={ (newItems) => modify({ objectDefs: newItems }) }
            createItem={ create }
            state={ listState }
            setState={ setListState }
            getItemIcon={ item => Defs.getObjectDefIconElement(item) }
            getItemLabel={ item => item.name }
        />

        { curObject && <div key={ curObject.id }
            style={{
                width: "100%",
                height: "100%",
                overflowY: "scroll",
                paddingRight: "0.25em",
                marginBottom: "10em",
        }}>
            <UI.TabGroup
                value={ curTab }
                onChange={ setCurTab }
                labels={[
                    "Appearance",
                    "Properties",
                ]}/>

            <br/>
            
            { curTab === 0 &&
                <UI.Grid template="auto auto">

                    <UI.Cell justifyEnd>
                        Name
                    </UI.Cell>

                    <UI.Cell justifyStretch>
                        <UI.Input
                            value={ curObject.name }
                            onChange={ (value) => modifyObject({ name: value }) }
                            fullWidth
                        />
                    </UI.Cell>

                    <UI.Cell justifyEnd>
                        Folder
                    </UI.Cell>

                    <UI.Cell justifyStretch>
                        <UI.Input
                            value={ Hierarchy.stringifyFolder(curObject.folder) }
                            onChange={ (value) => modifyObject({ folder: Hierarchy.parseFolder(value) }) }
                            fullWidth
                        />
                    </UI.Cell>

                    <UI.Cell justifyEnd>
                        ID
                    </UI.Cell>

                    <UI.Cell justifyStart>
                        { curObject.id }
                    </UI.Cell>

                    <UI.Cell span={ 2 } divider/>

                    <UI.Cell span={ 2 } justifyCenter>
                        <UI.Button
                            label="⛰️ Load Image..."
                            onClick={ loadImage }
                        />
                    </UI.Cell>
                    
                    <UI.Cell justifyEnd>
                        Image Rect
                    </UI.Cell>

                    <UI.Cell>
                        <UI.Input
                            number
                            value={ curObject.imageRect.x }
                            onChangeNumber={ (value) => modifyObject({ imageRect: { x: value } }) }
                        />
                        { " × " }
                        <UI.Input
                            number
                            value={ curObject.imageRect.y }
                            onChangeNumber={ (value) => modifyObject({ imageRect: { y: value } }) }
                        />
                        { " px (x, y)" }
                        <br/>
                        <UI.Input
                            number
                            value={ curObject.imageRect.width }
                            onChangeNumber={ (value) => modifyObject({ imageRect: { width: value } }) }
                        />
                        { " × " }
                        <UI.Input
                            number
                            value={ curObject.imageRect.height }
                            onChangeNumber={ (value) => modifyObject({ imageRect: { height: value } }) }
                        />
                        { " px (size)" }
                    </UI.Cell>

                    <UI.Cell span={ 2 } divider/>

                    <UI.Cell justifyEnd>
                        Pivot
                    </UI.Cell>

                    <UI.Cell>
                        <UI.Input
                            number
                            value={ curObject.pivotPercent.x * 100 }
                            onChangeNumber={ (value) => modifyObject({ pivotPercent: { x: value / 100 } }) }
                        />
                        { " × " }
                        <UI.Input
                            number
                            value={ curObject.pivotPercent.y * 100 }
                            onChangeNumber={ (value) => modifyObject({ pivotPercent: { y: value / 100 } }) }
                        />
                        { " % of size" }
                    </UI.Cell>
                    
                    <UI.Cell justifyEnd>
                        Interaction Rect
                    </UI.Cell>

                    <UI.Cell>
                        <UI.Input
                            number
                            value={ curObject.interactionRect.x }
                            onChangeNumber={ (value) => modifyObject({ interactionRect: { x: value } }) }
                        />
                        { " × " }
                        <UI.Input
                            number
                            value={ curObject.interactionRect.y }
                            onChangeNumber={ (value) => modifyObject({ interactionRect: { y: value } }) }
                        />
                        { " px (x, y)" }
                        <br/>
                        <UI.Input
                            number
                            value={ curObject.interactionRect.width }
                            onChangeNumber={ (value) => modifyObject({ interactionRect: { width: value } }) }
                        />
                        { " × " }
                        <UI.Input
                            number
                            value={ curObject.interactionRect.height }
                            onChangeNumber={ (value) => modifyObject({ interactionRect: { height: value } }) }
                        />
                        { " px (size)" }
                    </UI.Cell>

                    <UI.Cell justifyEnd>
                        Resizable
                    </UI.Cell>

                    <UI.Cell>
                        <UI.Checkbox
                            value={ curObject.resizeable }
                            onChange={ (value) => modifyObject({ resizeable: value }) }
                        />
                    </UI.Cell>

                </UI.Grid>
            }

            { curTab === 1 &&
                <UI.Grid template="auto auto">

                    <UI.Cell span={ 2 } justifyStretch>
                        <ObjectInheritanceList
                            value={ curObject.inheritPropertiesFromObjectDefs }
                            onChange={ (value) => setObject({ ...curObject, inheritPropertiesFromObjectDefs: value }) }
                        />
                    </UI.Cell>

                    <UI.Cell span={ 2 } divider/>

                    <UI.Cell span={ 2 } justifyStretch>
                        <PropertyDefsPanel
                            defProperties={ curObject.properties }
                            setDefProperties={ (value) => setObject({ ...curObject, properties: value }) }
                        />
                    </UI.Cell>

                </UI.Grid>
            }

        </div> }

        <UI.Cell fullHeight>
            { curObject &&
                <UI.ImageView
                    key={ curObjectId }
                    imageData={ curObjectImg?.element }
                    onRender={ renderPreview }
                />
            }
        </UI.Cell>
        
    </UI.Grid>
}