import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import * as Project from "../project/index"
import { PanelPadding } from "../ui/PanelPadding"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { List } from "../ui/List"
import { ImageView, ImageViewState } from "../ui/ImageView"
import { Grid, Cell } from "../ui/Grid"
import { global } from "../global"
import styled from "styled-components"
import { Select } from "../ui/Select"


export function InputPicker()
{
    const curLayer = global.project.defs.layerDefs.find(l => l.id === global.editingLayerId)


    const ctx = Dockable.useContentContext()
    ctx.setTitle(`Input Picker`)
    ctx.setPreferredSize(450, 500)


    return <PanelPadding>

        { curLayer?.type === "tile" && <TilesetPicker/> }

    </PanelPadding>
}


function TilesetPicker()
{
    const curTilesetIndex = global.project.defs.tilesetDefs.findIndex(t => t.id === global.editingTilesetId)
    const curTileset = global.project.defs.tilesetDefs.find(t => t.id === global.editingTilesetId)
    const curTilesetImg = global.images[curTileset?.imageId ?? -1]


    React.useEffect(() =>
    {
        if (!curTileset && global.project.defs.tilesetDefs.length > 0)
        {
            global.editingTilesetId = global.project.defs.tilesetDefs[0].id
            global.editingToken.commit()
        }

    }, [curTileset, global.editingToken.updateToken])


    const chooseTilesetId = (tilesetId: Project.ID) =>
    {
        global.editingTilesetId = tilesetId
        global.editingToken.commit()
    }


    const imageViewHandlers = React.useMemo(() =>
    {
        if (!curTileset || !curTilesetImg)
            return null

        const onMouseDown = (state: ImageViewState) =>
        {
            global.editingTilesetStampSet.clear()

            let originTileIndex: number | undefined = undefined

            state.onMouseMove = (state: ImageViewState) =>
            {
                const tileIndex = Project.getTileIndexForPixel(curTileset, state.mouse.pos)
                if (tileIndex === undefined)
                    return

                if (originTileIndex === undefined)
                    originTileIndex = tileIndex

                const origCell = Project.getCellForTileIndex(curTileset, originTileIndex)
                const destCell = Project.getCellForTileIndex(curTileset, tileIndex)

                global.editingTilesetStampSet.clear()
                global.editingTileStamp =
                {
                    width: Math.abs(origCell.x - destCell.x) + 1,
                    height: Math.abs(origCell.y - destCell.y) + 1,
                    tiles: [],
                }
                
                for (let y = Math.min(origCell.y, destCell.y);
                    y <= Math.max(origCell.y, destCell.y);
                    y++)
                {
                    for (let x = Math.min(origCell.x, destCell.x);
                        x <= Math.max(origCell.x, destCell.x);
                        x++)
                    {
                        const t = Project.getTileIndexForCell(curTileset, { x, y })!
                        global.editingTileStamp.tiles.push({ tileId: t, tilesetId: curTileset.id })
                        global.editingTilesetStampSet.add(t)
                    }
                }
                
                global.editingToken.commit()
            }
        }

        const onRender = (ctx: CanvasRenderingContext2D) =>
        {
            for (const tileIndex of global.editingTilesetStampSet)
            {
                const pos = Project.getPixelForTileIndex(curTileset, tileIndex)

                ctx.fillStyle = "#0cf8"
                ctx.fillRect(pos.x, pos.y, curTileset.gridCellWidth, curTileset.gridCellHeight)
            }
        }

        return {
            onMouseDown,
            onRender,
        }

    }, [curTileset, curTilesetImg, global.editingToken.updateToken])


    return <Grid template="1fr" templateRows="auto 1fr" fullHeight>

        <Select
            value={ global.editingTilesetId.toString() }
            onChange={ (value) => chooseTilesetId(parseInt(value)) }
        >
            { global.project.defs.tilesetDefs.map(tilesetDef =>
                <option key={ tilesetDef.id } value={ tilesetDef.id }>
                    { "🌲 " + tilesetDef.name }
                </option>
            )}
        </Select>

        <ImageView
            key={ curTileset?.imageId }
            imageData={ curTilesetImg }
            onRender={ imageViewHandlers?.onRender }
            onMouseDown={ imageViewHandlers?.onMouseDown }
        />
    </Grid>
}