import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Filesystem from "../data/filesystem"
import * as Editors from "../data/editors"
import * as Images from "../data/images"
import * as UI from "../ui"
import { global } from "../global"
import styled from "styled-components"
import { DeepAssignable } from "../util/deepAssign"


export function DefsTilesets(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs
    const modify = (newDefs: DeepAssignable<Defs.Defs>) =>
    {
        Editors.deepAssignEditor(props.editorIndex, {
            defs: newDefs,
        })
    }

    const [curTilesetId, setCurTilesetId] = React.useState<ID.ID>("")
    const [curTileAttrbId, setCurTileAttrbId] = React.useState<ID.ID>("")

    const curTilesetIndex = defs.tilesetDefs.findIndex(t => t.id === curTilesetId)
    const curTileset = defs.tilesetDefs.find(t => t.id === curTilesetId)
    const curTilesetImg = Images.getImageLazy(curTileset?.imageSrc ?? "")
    

    const modifyTileset = (tilesetDef: DeepAssignable<Defs.DefTileset>) =>
    {
        if (curTilesetIndex < 0)
            return

        modify({ tilesetDefs: { [curTilesetIndex]: tilesetDef }})
    }


    const createTileset = () =>
    {
        const [newNextIDs, newID] = ID.getNextID(defs.nextIDs)

        const tilesetDef: Defs.DefTileset =
        {
            id: newID,
            name: "tileset_" + (defs.tilesetDefs.length + 1),
            imageSrc: "",
            width: 0,
            height: 0,
            gridCellWidth: 16,
            gridCellHeight: 16,
            gridGapX: 0,
            gridGapY: 0,
            gridOffsetX: 0,
            gridOffsetY: 0,
            tileAttributes: [],
        }

        modify(
        {
            nextIDs: newNextIDs,
            tilesetDefs: { [defs.tilesetDefs.length]:
                {
                    ...tilesetDef,
                    id: newID,
                }
            },
        })

        setCurTilesetId(newID)
    }


    const deleteCurTileset = () =>
    {
        modify(
        {
            tilesetDefs: defs.tilesetDefs.filter(l => l.id !== curTilesetId),
        })
    }


    const moveUp = () =>
    {
        if (curTilesetIndex <= 0)
            return
            
        modify({
            tilesetDefs: [
                ...defs.tilesetDefs.slice(0, curTilesetIndex - 1),
                curTileset!,
                defs.tilesetDefs[curTilesetIndex - 1],
                ...defs.tilesetDefs.slice(curTilesetIndex + 1),
            ],
        })
    }


    const moveDown = () =>
    {
        if (curTilesetIndex >= defs.tilesetDefs.length - 1)
            return

        modify({
            tilesetDefs: [
                ...defs.tilesetDefs.slice(0, curTilesetIndex),
                defs.tilesetDefs[curTilesetIndex + 1],
                curTileset!,
                ...defs.tilesetDefs.slice(curTilesetIndex + 2),
            ],
        })
    }


    const loadTilesetImage = async () =>
    {
        const imageRootRelativePath = await Filesystem.showImagePicker()
        if (!imageRootRelativePath)
            return

        const image = await Images.loadImage(imageRootRelativePath)
        if (!image)
            return

        modify(
        {
            tilesetDefs: { [curTilesetIndex]: {
                imageSrc: imageRootRelativePath,
                width: image.width,
                height: image.height,
            } },
        })
    }


    const renderTilesetImage = React.useMemo(() => (ctx: CanvasRenderingContext2D) =>
    {
        if (!curTileset || !curTilesetImg)
            return

        const attrbDef = Defs.getTileAttributeDef(defs, curTileAttrbId)

        ctx.strokeStyle = "#ccc"
        
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "900 " + (curTileset.gridCellHeight * 0.75) + "px system-ui"
        
        for (let x = curTileset.gridOffsetX;
            x + curTileset.gridCellWidth <= curTilesetImg.width;
            x += curTileset.gridCellWidth + curTileset.gridGapX)
        {
            for (let y = curTileset.gridOffsetY;
                y + curTileset.gridCellHeight <= curTilesetImg.height;
                y += curTileset.gridCellHeight + curTileset.gridGapY)
            {
                ctx.strokeRect(
                    x, y,
                    curTileset.gridCellWidth, curTileset.gridCellHeight)
            
                if (attrbDef)
                {
                    const tileIndex = Defs.getTileIndexForPixel(
                        curTileset,
                        { x, y })

                    if (tileIndex === undefined)
                        continue

                    const attrbs = Defs.getTileAttributesForTile(
                        curTileset.tileAttributes,
                        tileIndex)

                    if (attrbs.some(a => a === curTileAttrbId))
                    {
                        ctx.fillStyle = attrbDef.color
                        ctx.globalAlpha = 0.25
                        ctx.fillRect(
                            x, y,
                            curTileset.gridCellWidth, curTileset.gridCellHeight)
                        ctx.globalAlpha = 1

                        ctx.fillStyle = "#000"
                        ctx.fillText(
                            attrbDef.label,
                            x + curTileset.gridCellWidth / 2 + 1,
                            y + curTileset.gridCellHeight / 2 + 1,
                            curTileset.gridCellWidth * 0.95)

                        ctx.fillStyle = attrbDef.color
                        ctx.fillText(
                            attrbDef.label,
                            x + curTileset.gridCellWidth / 2,
                            y + curTileset.gridCellHeight / 2,
                            curTileset.gridCellWidth * 0.95)
                    }
                }
            }
        }

    }, [curTileset, curTilesetImg, curTileAttrbId])


    const onMouseDown = (state: UI.ImageViewState) =>
    {
        if (!curTileset)
            return
        
        let erasing: boolean | null = null

        let curAttrbs = curTileset.tileAttributes

        state.onMouseMove = (state: UI.ImageViewState) =>
        {
            if (!curTileset)
                return
            
            const tileIndex = Defs.getTileIndexForPixel(
                curTileset,
                state.mouse.pos)

            if (tileIndex === undefined)
                return

            const attrbs = new Set(Defs.getTileAttributesForTile(
                curAttrbs,
                tileIndex))

            if (erasing === null)
                erasing = attrbs.has(curTileAttrbId)

            if (erasing)
                attrbs.delete(curTileAttrbId)
            else
                attrbs.add(curTileAttrbId)
                
            curAttrbs = Defs.setTileAttributesForTile(
                curAttrbs,
                tileIndex,
                [...attrbs])

            modifyTileset({
                tileAttributes: curAttrbs,
            })
        }

        state.onMouseUp = () =>
        {
            global.editors.refreshToken.commit()
        }
    }


    return <UI.Grid template="15em 25em 1fr" templateRows="auto 1fr" fullHeight alignStart>

        <UI.Cell>
            <UI.Button
                label="+ Tileset"
                onClick={ createTileset }
            />
        </UI.Cell>

        <UI.Cell/>

        <UI.Cell/>

        <UI.List
            value={ curTilesetId }
            onChange={ setCurTilesetId }
            items={ defs.tilesetDefs.map(tilesetDef => ({
                id: tilesetDef.id,
                label: tilesetDef.name,
                icon: Defs.getTilesetDefIconElement(tilesetDef),
            }))}
        />

        { curTileset && <UI.Grid template="1fr" templateRows="auto 1fr" fullHeight key={ curTileset.id }>
            
            <UI.Grid template="auto auto">

                <UI.Cell justifyEnd>
                    Name
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <UI.Input
                        value={ curTileset.name }
                        onChange={ (value) => modifyTileset({ name: value }) }
                        fullWidth
                    />
                </UI.Cell>

                <UI.Cell span={ 2 } justifyCenter>
                </UI.Cell>
                
                <UI.Cell span={ 2 } justifyEnd>
                    <UI.Button
                        label="🔼"
                        onClick={ moveUp }
                    />

                    <UI.Button
                        label="🔽"
                        onClick={ moveDown }
                    />

                    <UI.Button
                        label="❌ Delete"
                        onClick={ deleteCurTileset }
                    />
                </UI.Cell>

                <UI.Cell span={ 2 } divider/>

                <UI.Cell span={ 2 } justifyCenter>
                    <UI.Button
                        label="⛰️ Load Image..."
                        onClick={ loadTilesetImage }
                    />
                </UI.Cell>

                <UI.Cell span={ 2 } divider/>
                
                <UI.Cell justifyEnd>
                    Tile Size
                </UI.Cell>

                <UI.Cell>
                    <UI.Input
                        number
                        value={ curTileset.gridCellWidth }
                        onChangeNumber={ (value) => modifyTileset({ gridCellWidth: value }) }
                    />
                    { " × " }
                    <UI.Input
                        number
                        value={ curTileset.gridCellHeight }
                        onChangeNumber={ (value) => modifyTileset({ gridCellHeight: value }) }
                    />
                    { " px" }
                </UI.Cell>

                <UI.Cell justifyEnd>
                    Tile Gap
                </UI.Cell>

                <UI.Cell>
                    <UI.Input
                        number
                        value={ curTileset.gridGapX }
                        onChangeNumber={ (value) => modifyTileset({ gridGapX: value }) }
                    />
                    { " × " }
                    <UI.Input
                        number
                        value={ curTileset.gridGapY }
                        onChangeNumber={ (value) => modifyTileset({ gridGapY: value }) }
                    />
                    { " px" }
                </UI.Cell>


                <UI.Cell justifyEnd>
                    Top-Left Offset
                </UI.Cell>

                <UI.Cell>
                    <UI.Input
                        number
                        value={ curTileset.gridOffsetX }
                        onChangeNumber={ (value) => modifyTileset({ gridOffsetX: value }) }
                    />
                    { " × " }
                    <UI.Input
                        number
                        value={ curTileset.gridOffsetY }
                        onChangeNumber={ (value) => modifyTileset({ gridOffsetY: value }) }
                    />
                    { " px" }
                </UI.Cell>

            </UI.Grid>

            <UI.List
                value={ curTileAttrbId }
                onChange={ setCurTileAttrbId }
                items={ defs.tileAttributeDefs.map(tileAttrbDef => ({
                    id: tileAttrbDef.id,
                    label: tileAttrbDef.name,
                    icon: Defs.getTileAttributeDefIconElement(tileAttrbDef),
                }))}
            />

        </UI.Grid> }

        <UI.Cell fullHeight>
            { curTileset &&
                <UI.ImageView
                    key={ curTilesetId }
                    imageData={ curTilesetImg?.element }
                    onMouseDown={ onMouseDown }
                    onRender={ renderTilesetImage }
                />
            }
        </UI.Cell>
        
    </UI.Grid>
}