import * as React from "react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Grid, Cell } from "../ui/Grid"
import { List } from "../ui/List"
import { ImageView } from "../ui/ImageView"
import { global, deepAssignProject, openTilesetImage } from "../global"
import { deepAssign, DeepAssignable } from "../util/deepAssign"
import styled from "styled-components"
import * as Project from "project"


export function TilesetDefs()
{
    const [curTilesetId, setCurTilesetId] = React.useState<Project.ID>(-1)
    const curTilesetIndex = global.project.defs.tilesetDefs.findIndex(t => t.id === curTilesetId)
    const curTileset = global.project.defs.tilesetDefs.find(t => t.id === curTilesetId)
    const curTilesetImg = global.images[curTileset?.imageId ?? -1]


    const deepAssignTileset = (tilesetDef: DeepAssignable<Project.DefTileset>) =>
    {
        if (curTilesetIndex < 0)
            return

        deepAssignProject({ defs: { tilesetDefs: { [curTilesetIndex]: tilesetDef }}})
    }


    const createTileset = () =>
    {
        const tilesetDef: Project.DefTileset =
        {
            id: global.project.nextId,
            name: "tileset_" + (global.project.defs.tilesetDefs.length + 1),
            imageId: -1,
            width: 0,
            height: 0,
            gridCellWidth: 16,
            gridCellHeight: 16,
            gridGapX: 0,
            gridGapY: 0,
            gridOffsetX: 0,
            gridOffsetY: 0,
        }

        deepAssignProject(
        {
            nextId: tilesetDef.id + 1,
            defs: { tilesetDefs: { [global.project.defs.tilesetDefs.length]: tilesetDef }},
        })

        setCurTilesetId(tilesetDef.id)
    }


    const deleteCurTileset = () =>
    {
        deepAssignProject(
        {
            defs: { tilesetDefs: global.project.defs.tilesetDefs.filter(l => l.id !== curTilesetId) },
        })
    }


    const loadTilesetImage = async () =>
    {
        const imageId = await openTilesetImage()

        const image = global.images[imageId]
        if (!image)
            return

        deepAssignProject(
        {
            defs: { tilesetDefs: { [curTilesetIndex]: {
                imageId,
                width: image.width,
                height: image.height,
            } }},
        })

        global.editingToken.commit()
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


    return <Grid template="1fr 2fr" templateRows="auto 1fr" maxWidth="45em" fullHeight>

        <Cell>
            <Button
                label="+ Tileset"
                onClick={ createTileset }
            />
        </Cell>

        <Cell/>

        <List
            value={ curTilesetId }
            onChange={ setCurTilesetId }
            items={ global.project.defs.tilesetDefs.map(tilesetDef => ({
                id: tilesetDef.id,
                label: "🌲 " + tilesetDef.name,
            }))}
        />

        { curTileset && <Grid template="1fr" templateRows="auto 1fr" fullHeight key={ curTileset.id }>
            <Grid template="auto auto">

                <Cell span={ 2 } justifyEnd>
                    <Button
                        label="Delete"
                        onClick={ deleteCurTileset }
                    />
                </Cell>

                <Cell span={ 2 } justifyCenter>
                    { "🌲 Tileset" }
                </Cell>

                <Cell span={ 2 } divider/>

                <Cell justifyEnd>
                    Unique Name
                </Cell>

                <Cell justifyStretch>
                    <Input
                        value={ curTileset.name }
                        onChange={ (value) => deepAssignTileset({ name: value }) }
                        fullWidth
                    />
                </Cell>
                
                <Cell justifyEnd>
                    Tile Size
                </Cell>

                <Cell>
                    <Grid template="1fr auto 1fr auto">
                        <Cell>
                            <Input
                                number
                                value={ curTileset.gridCellWidth }
                                onChangeNumber={ (value) => deepAssignTileset({ gridCellWidth: value }) }
                            />
                        </Cell>
                        <Cell> × </Cell>
                        <Cell>
                            <Input
                                number
                                value={ curTileset.gridCellHeight }
                                onChangeNumber={ (value) => deepAssignTileset({ gridCellHeight: value }) }
                            />
                        </Cell>
                        <Cell>px</Cell>
                    </Grid>
                </Cell>

                <Cell justifyEnd>
                    Tile Gap
                </Cell>

                <Cell>
                    <Grid template="1fr auto 1fr auto">
                        <Cell>
                            <Input
                                number
                                value={ curTileset.gridGapX }
                                onChangeNumber={ (value) => deepAssignTileset({ gridGapX: value }) }
                            />
                        </Cell>
                        <Cell> × </Cell>
                        <Cell>
                            <Input
                                number
                                value={ curTileset.gridGapY }
                                onChangeNumber={ (value) => deepAssignTileset({ gridGapY: value }) }
                            />
                        </Cell>
                        <Cell>px</Cell>
                    </Grid>
                </Cell>


                <Cell justifyEnd>
                    Top-Left Offset
                </Cell>

                <Cell>
                    <Grid template="1fr auto 1fr auto">
                        <Cell>
                            <Input
                                number
                                value={ curTileset.gridOffsetX }
                                onChangeNumber={ (value) => deepAssignTileset({ gridOffsetX: value }) }
                            />
                        </Cell>
                        <Cell> × </Cell>
                        <Cell>
                            <Input
                                number
                                value={ curTileset.gridOffsetY }
                                onChangeNumber={ (value) => deepAssignTileset({ gridOffsetY: value }) }
                            />
                        </Cell>
                        <Cell>px</Cell>
                    </Grid>
                </Cell>

                <Cell span={ 2 } divider/>

                <Cell span={ 2 } justifyCenter>
                    <Button
                        label="Load Image..."
                        onClick={ loadTilesetImage }
                    />
                </Cell>

            </Grid>

            <ImageView
                imageData={ curTilesetImg }
                onRender={ renderTilesetImage }
            />
        </Grid> }

    </Grid>
}