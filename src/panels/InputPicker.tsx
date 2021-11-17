import * as React from "react"
import * as Dockable from "@hlorenzi/react-dockable"
import * as Project from "project"
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


    const chooseTilesetId = (tilesetId: Project.ID) =>
    {
        global.editingTilesetId = tilesetId
        global.editingToken.commit()
    }


    const imageViewHandlers = React.useMemo(() =>
    {
        if (!curTileset || !curTilesetImg)
            return null
        
        const getTileIndex = (pos: { x: number, y: number }) =>
        {
            const tx = Math.floor((pos.x - curTileset.gridOffsetX) / (curTileset.gridCellWidth  + curTileset.gridGapX))
            const ty = Math.floor((pos.y - curTileset.gridOffsetY) / (curTileset.gridCellHeight + curTileset.gridGapY))
            const tilesPerRow = Math.floor((curTilesetImg.width - curTileset.gridOffsetX + curTileset.gridGapY) / (curTileset.gridCellHeight + curTileset.gridGapY))
            return ty * tilesPerRow + tx
        }

        const onMouseDown = (state: ImageViewState) =>
        {
            global.editingTilesetStampSet.clear()

            state.onMouseMove = (state: ImageViewState) =>
            {
                const tileIndex = getTileIndex(state.mouse.pos)
                global.editingTilesetStampSet.add(tileIndex)
                global.editingToken.commit()
                console.log(tileIndex)
            }
        }

        const onRender = (ctx: CanvasRenderingContext2D) =>
        {
            const tilesPerRow = Math.floor((curTilesetImg.width - curTileset.gridOffsetX + curTileset.gridGapY) / (curTileset.gridCellHeight + curTileset.gridGapY))

            for (const tileIndex of global.editingTilesetStampSet)
            {
                const tx = tileIndex % tilesPerRow
                const ty = Math.floor(tileIndex / tilesPerRow)

                const x = curTileset.gridOffsetX + tx * (curTileset.gridCellWidth  + curTileset.gridGapX)
                const y = curTileset.gridOffsetY + ty * (curTileset.gridCellHeight + curTileset.gridGapY)

                ctx.fillStyle = "#0cf8"
                ctx.fillRect(x, y, curTileset.gridCellWidth, curTileset.gridCellHeight)
            }
        }

        return {
            onMouseDown,
            onRender,
        }

    }, [curTileset, curTilesetImg, global.editingToken.updateToken])


    return <Grid
        template="1fr" templateRows="auto 1fr" fullHeight 
        key={ global.editingToken.updateToken }>

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
            imageData={ curTilesetImg }
            onRender={ imageViewHandlers?.onRender }
            onMouseDown={ imageViewHandlers?.onMouseDown }
        />
    </Grid>
}