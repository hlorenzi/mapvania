import * as React from "react"
import styled from "styled-components"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as Images from "../data/images"
import * as MapEditor from "../mapEditor"
import * as UI from "../ui"
import { global } from "../global"


export function TilePicker(props: {
    editorIndex: number,
})
{
    const defs = (global.editors.editors[props.editorIndex] as Editors.EditorMap).defs
    
    const curTileset = defs.tilesetDefs.find(t => t.id === global.editors.mapEditing.tilesetDefId)
    const curTilesetImg = Images.getImageLazy(curTileset?.imageSrc ?? "")


    React.useEffect(() =>
    {
        if (!curTileset && defs.tilesetDefs.length > 0)
        {
            global.editors.mapEditing.tilesetDefId = defs.tilesetDefs[0].id
            global.editors.refreshToken.commit()
        }

    }, [global.editors.mapEditing.tilesetDefId])


    const chooseTilesetId = (tilesetId: ID.ID) =>
    {
        global.editors.mapEditing.tilesetDefId = tilesetId
        global.editors.refreshToken.commit()
    }


    const imageViewHandlers = React.useMemo(() =>
    {
        if (!curTileset)
            return null

        const onMouseDown = (state: UI.ImageViewState) =>
        {
            global.editors.mapEditing.tilesetStampSet.clear()

            let originTileIndex: number | undefined = undefined

            console.log("tile picker mouse down")

            state.onMouseMove = (state: UI.ImageViewState) =>
            {
                console.log("tile picker mouse move")
                const tileIndex = Defs.getTileIndexForPixel(curTileset, state.mouse.pos)
                if (tileIndex === undefined)
                    return

                if (originTileIndex === undefined)
                    originTileIndex = tileIndex

                    console.log("tile picker mouse move 2")
                const origCell = Defs.getCellForTileIndex(curTileset, originTileIndex)
                const destCell = Defs.getCellForTileIndex(curTileset, tileIndex)

                global.editors.mapEditing.tilesetStampSet.clear()
                global.editors.mapEditing.tileStamp =
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
                        const t = Defs.getTileIndexForCell(curTileset, { x, y })!
                        global.editors.mapEditing.tileStamp.tiles.push({ tileId: t, tilesetDefId: curTileset.id })
                        global.editors.mapEditing.tilesetStampSet.add(t)
                    }
                }
                
                console.log("tile picker mouse move 3")
                global.editors.mapEditing.tileTool = "draw"
                global.editors.refreshToken.commit()
            }
        }

        const onRender = (ctx: CanvasRenderingContext2D) =>
        {
            for (const tileIndex of global.editors.mapEditing.tilesetStampSet)
            {
                const pos = Defs.getPixelForTileIndex(curTileset, tileIndex)

                ctx.fillStyle = "#0cf8"
                ctx.fillRect(pos.x, pos.y, curTileset.gridCellWidth, curTileset.gridCellHeight)
            }
        }

        return {
            onMouseDown,
            onRender,
        }

    }, [curTileset])


    return <div style={{
        height: "100%",
        minHeight: "0",
        borderRadius: "0.5em",
        contain: "paint",
        pointerEvents: "auto",
        backgroundColor: "#242424",
    }}>
        <UI.HeaderAndBody
            header="TILE SELECTOR"
        >
            <div style={{
                width: "100%",
                height: "100%",
                minHeight: "0",

                gridTemplate: "auto 1fr / 1fr",
            }}>

                <UI.Select
                    value={ global.editors.mapEditing.tilesetDefId }
                    onChange={ (value) => chooseTilesetId(value) }
                >
                    { defs.tilesetDefs.map(tilesetDef =>
                        <option key={ tilesetDef.id } value={ tilesetDef.id }>
                            { "🌲 " + tilesetDef.name }
                        </option>
                    )}
                </UI.Select>

                <UI.ImageView
                    key={ global.editors.mapEditing.tilesetDefId }
                    imageData={ curTilesetImg?.element }
                    onRender={ imageViewHandlers?.onRender }
                    onMouseDown={ imageViewHandlers?.onMouseDown }
                />

            </div>
        
        </UI.HeaderAndBody>

    </div>
}