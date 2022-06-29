import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as Images from "../data/images"
import * as UI from "../ui"
import { global } from "../global"
import styled from "styled-components"
import { DeepAssignable } from "../util/deepAssign"


export function DefsTileBrushes(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs
    const modifyDefs = (newDefs: Defs.Defs) =>
    {
        Editors.assignEditorDefs(props.editorIndex, newDefs)
    }

    const [curBrushId, setCurBrushId] = React.useState<ID.ID>("")
    const curBrushIndex = defs.tileBrushDefs.findIndex(l => l.id === curBrushId)
    const curBrush = defs.tileBrushDefs.find(l => l.id === curBrushId)
    const curTileset = Defs.getTileset(defs, curBrush?.tilesetDefId ?? "")
    const curTilesetImg = Images.getImageLazy(curTileset?.imageSrc ?? "")
    

    const modify = (brushDef: Defs.DefTileBrush) =>
    {
        if (curBrushIndex < 0)
            return

        modifyDefs(Defs.setAssetDef(defs, "tileBrushDefs", curBrushIndex, brushDef))
    }


    const create = () =>
    {
        const [newNextIDs, newID] = ID.getNextID(defs.nextIDs)
        let newDefs = Defs.setAssetDef(defs, "tileBrushDefs", defs.tileBrushDefs.length, {
            id: newID,
            name: "brush_" + defs.tileBrushDefs.length,
            tilesetDefId: "",
            tiles: {},
        })
        newDefs = {
            ...newDefs,
            nextIDs: newNextIDs,
        }
        modifyDefs(newDefs)
        setCurBrushId(newID)
    }


    const erase = () =>
    {
        modifyDefs(Defs.removeAssetDef(defs, "tileBrushDefs", curBrushIndex))
    }


    const moveUp = () =>
    {
        modifyDefs(Defs.moveAssetDef(defs, "tileBrushDefs", curBrushIndex, curBrushIndex - 1))
    }


    const moveDown = () =>
    {
        modifyDefs(Defs.moveAssetDef(defs, "tileBrushDefs", curBrushIndex, curBrushIndex + 1))
    }


    const renderTilesetImage = React.useMemo(() => (ctx: CanvasRenderingContext2D) =>
    {
        if (!curBrush || !curTileset || !curTilesetImg)
            return

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
            
                const tileIndex = Defs.getTileIndexForPixel(
                    curTileset,
                    { x, y })

                if (tileIndex === undefined)
                    continue

                const data = Defs.getTileBrushData(
                    curBrush,
                    tileIndex)

                for (let cx = 0; cx < 3; cx++)
                for (let cy = 0; cy < 3; cy++)
                {
                    if (data.connections[cx + cy * 3])
                    {
                        ctx.fillStyle = "#f008"
                        ctx.fillRect(
                            x + cx * curTileset.gridCellWidth / 3,
                            y + cy * curTileset.gridCellHeight / 3,
                            curTileset.gridCellWidth / 3,
                            curTileset.gridCellHeight / 3)
                    }
                }
            }
        }

    }, [curBrush, curTileset, curTilesetImg])


    const onMouseDown = (state: UI.ImageViewState) =>
    {
        if (!curBrush || !curTileset)
            return
        
        let erasing: boolean | null = null

        let originalBrush = curBrush

        state.onMouseMove = (state: UI.ImageViewState) =>
        {
            if (!curTileset)
                return
            
            const tileIndex = Defs.getTileIndexForPixel(
                curTileset,
                state.mouse.pos)

            if (tileIndex === undefined)
                return

            const tilePx = Defs.getPixelForTileIndex(
                curTileset,
                tileIndex)
                
            const quadrantX = Math.min(2, Math.floor(
                (state.mouse.pos.x - tilePx.x) / (curTileset.gridCellWidth / 3)))
                
            const quadrantY = Math.min(2, Math.floor(
                (state.mouse.pos.y - tilePx.y) / (curTileset.gridCellHeight / 3)))

            const quadrant = quadrantX + quadrantY * 3
            
            let data = Defs.getTileBrushData(
                originalBrush,
                tileIndex)

            if (erasing === null)
                erasing = data.connections[quadrant]

            data = {
                ...data,
                connections: [
                    ...data.connections.slice(0, quadrant),
                    !erasing,
                    ...data.connections.slice(quadrant + 1),
                ] as Defs.DefTileBrush["tiles"][number]["connections"]
            }

            originalBrush = Defs.setTileBrushData(
                originalBrush,
                tileIndex,
                data)

            modify(originalBrush)
        }

        state.onMouseUp = () =>
        {
            global.editors.refreshToken.commit()
        }
    }


    return <UI.Grid template="15em 25em 1fr" templateRows="auto 1fr" fullHeight alignStart>

        <UI.Cell>
            <UI.Button
                label="➕ Tile Brush"
                onClick={ create }
            />
        </UI.Cell>

        <UI.Cell/>

        <UI.Cell/>

        <UI.List
            value={ curBrushId }
            onChange={ setCurBrushId }
            items={ defs.tileBrushDefs.map(tileBrushDef => ({
                id: tileBrushDef.id,
                label: tileBrushDef.name,
                icon: Defs.getTileBrushDefIconElement(defs, tileBrushDef),
            }))}
        />

        { curBrush && <UI.Grid template="1fr" templateRows="auto 1fr" fullHeight key={ curBrush.id }>
            
            <UI.Grid template="auto auto">

                <UI.Cell justifyEnd>
                    Name
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <UI.Input
                        value={ curBrush.name }
                        onChange={ (value) => modify({ ...curBrush, name: value }) }
                        fullWidth
                    />
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
                        onClick={ erase }
                    />
                </UI.Cell>

                <UI.Cell span={ 2 } divider/>

                <UI.Cell justifyEnd>
                    Tileset ID
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <UI.Input
                        value={ curBrush.tilesetDefId }
                        onChange={ (value) => modify({ ...curBrush, tilesetDefId: value }) }
                        fullWidth
                    />
                </UI.Cell>
            
            </UI.Grid>
            
        </UI.Grid> }

        <UI.Cell fullHeight>
            { curTileset &&
                <UI.ImageView
                    key={ curTileset.id }
                    imageData={ curTilesetImg?.element }
                    onMouseDown={ onMouseDown }
                    onRender={ renderTilesetImage }
                />
            }
        </UI.Cell>

    </UI.Grid>
}