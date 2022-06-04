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
            name: "New Tileset " + (defs.tilesetDefs.length + 1),
            imageSrc: "",
            width: 0,
            height: 0,
            gridCellWidth: 16,
            gridCellHeight: 16,
            gridGapX: 0,
            gridGapY: 0,
            gridOffsetX: 0,
            gridOffsetY: 0,
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

        ctx.strokeStyle = "#ccc"
        
        for (let x = curTileset.gridOffsetX;
            x + curTileset.gridCellWidth <= curTilesetImg.width;
            x += curTileset.gridCellWidth + curTileset.gridGapX)
        {
            for (let y = curTileset.gridOffsetY;
                y + curTileset.gridCellHeight <= curTilesetImg.height;
                y += curTileset.gridCellHeight + curTileset.gridGapY)
            {
                ctx.strokeRect(x, y, curTileset.gridCellWidth, curTileset.gridCellHeight)
            }
        }

    }, [curTileset, curTilesetImg])


    return <UI.Grid template="15em auto 1fr" templateRows="auto 1fr" fullHeight alignStart>

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
                label: "🌲 " + tilesetDef.name,
            }))}
        />

        { curTileset && <UI.Grid template="1fr" templateRows="1fr" fullHeight key={ curTileset.id }>
            
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
                    <UI.Grid template="1fr auto 1fr auto">
                        <UI.Cell>
                            <UI.Input
                                number
                                value={ curTileset.gridCellWidth }
                                onChangeNumber={ (value) => modifyTileset({ gridCellWidth: value }) }
                            />
                        </UI.Cell>
                        <UI.Cell> × </UI.Cell>
                        <UI.Cell>
                            <UI.Input
                                number
                                value={ curTileset.gridCellHeight }
                                onChangeNumber={ (value) => modifyTileset({ gridCellHeight: value }) }
                            />
                        </UI.Cell>
                        <UI.Cell>px</UI.Cell>
                    </UI.Grid>
                </UI.Cell>

                <UI.Cell justifyEnd>
                    Tile Gap
                </UI.Cell>

                <UI.Cell>
                    <UI.Grid template="1fr auto 1fr auto">
                        <UI.Cell>
                            <UI.Input
                                number
                                value={ curTileset.gridGapX }
                                onChangeNumber={ (value) => modifyTileset({ gridGapX: value }) }
                            />
                        </UI.Cell>
                        <UI.Cell> × </UI.Cell>
                        <UI.Cell>
                            <UI.Input
                                number
                                value={ curTileset.gridGapY }
                                onChangeNumber={ (value) => modifyTileset({ gridGapY: value }) }
                            />
                        </UI.Cell>
                        <UI.Cell>px</UI.Cell>
                    </UI.Grid>
                </UI.Cell>


                <UI.Cell justifyEnd>
                    Top-Left Offset
                </UI.Cell>

                <UI.Cell>
                    <UI.Grid template="1fr auto 1fr auto">
                        <UI.Cell>
                            <UI.Input
                                number
                                value={ curTileset.gridOffsetX }
                                onChangeNumber={ (value) => modifyTileset({ gridOffsetX: value }) }
                            />
                        </UI.Cell>
                        <UI.Cell> × </UI.Cell>
                        <UI.Cell>
                            <UI.Input
                                number
                                value={ curTileset.gridOffsetY }
                                onChangeNumber={ (value) => modifyTileset({ gridOffsetY: value }) }
                            />
                        </UI.Cell>
                        <UI.Cell>px</UI.Cell>
                    </UI.Grid>
                </UI.Cell>

            </UI.Grid>

        </UI.Grid> }

        <UI.Cell fullHeight>
            <UI.ImageView
                key={ curTilesetId }
                imageData={ curTilesetImg?.element }
                onRender={ renderTilesetImage }
            />
        </UI.Cell>
        
    </UI.Grid>
}