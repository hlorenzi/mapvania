import * as React from "react"
import styled from "styled-components"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as Filesystem from "../data/filesystem"
import * as Images from "../data/images"
import * as MapEditor from "../mapEditor"
import * as UI from "../ui"
import { global } from "../global"
import { useCachedState } from "../util/useCachedState"


export function TilePicker(props: {
    editorIndex: number,
})
{
    const editor = global.editors.editors[props.editorIndex] as Editors.EditorMap
    const defs = editor.defs
    
    const [brushListState, setBrushListState] = useCachedState(
        "TilePicker_BrushListState",
        UI.makeHierarchicalListState())

    const [selectedTileset, setSelectedTileset] = useCachedState(
        "TilePicker_SelectedTileset",
        "")

    const [tab, setTab] = useCachedState(
        "TilePicker_Tab",
        0)
        
    const curTileset = defs.tilesetDefs.find(t => t.id === (global.editors.mapEditing.tilesetDefId || selectedTileset))
    
    const curTilesetImgPath = !curTileset ? "" :
        Filesystem.resolveRelativePath(
            editor.basePath,
            curTileset.imageSrc)
    
    const curTilesetImg = Images.getImageLazy(curTilesetImgPath)

    
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
        setSelectedTileset(tilesetId)
        global.editors.mapEditing.tilesetDefId = tilesetId
        global.editors.mapEditing.tilesetStampSet.clear()
        global.editors.mapEditing.tileBrushDefId = ""
        global.editors.refreshToken.commit()
    }


    const imageViewHandlers = React.useMemo(() =>
    {
        if (!curTileset)
            return null

        const onMouseDown = (state: UI.ImageViewState) =>
        {
            global.editors.mapEditing.tileBrushDefId = ""
            global.editors.mapEditing.tilesetStampSet.clear()

            let originTileIndex: number | undefined = undefined

            state.onMouseMove = (state: UI.ImageViewState) =>
            {
                const tileIndex = Defs.getTileIndexForPixel(curTileset, state.mouse.pos)
                if (tileIndex === undefined)
                    return

                if (originTileIndex === undefined)
                    originTileIndex = tileIndex

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
                
                global.editors.mapEditing.tool = "draw"
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


    const chooseBrush = (brushId: ID.ID) =>
    {
        global.editors.mapEditing.tilesetDefId = ""
        global.editors.mapEditing.tilesetStampSet.clear()
        global.editors.mapEditing.tileBrushDefId = brushId
        global.editors.mapEditing.tool = "draw"
        global.editors.refreshToken.commit()
    }


    return <div style={{
        height: "100%",
        minHeight: "0",
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

                display: "grid",
                gridTemplate: "auto 1fr / 1fr",
                justifyItems: "start",
            }}>
                <UI.TabGroup
                    value={ tab }
                    onChange={ setTab }
                    labels={[
                        "Tilesets",
                        "Brushes",
                    ]}
                />

                { tab === 0 &&
                    <div style={{
                        width: "100%",
                        height: "100%",
                        minHeight: 0,
                        display: "grid",
                        gridTemplate: "auto 1fr / 1fr",
                    }}>
                        <UI.Select
                            value={ global.editors.mapEditing.tilesetDefId || selectedTileset }
                            onChange={ chooseTilesetId }
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
                }

                { tab === 1 &&
                    <UI.HierarchicalList<Defs.DefTileBrush>
                        is2D
                        items={ defs.tileBrushDefs }
                        value={ global.editors.mapEditing.tileBrushDefId }
                        onChange={ chooseBrush }
                        getItemIcon={ item => Defs.getTileBrushDefIconElement(editor.defsBasePath, defs, item) }
                        getItemLabel={ item => item.name }
                        state={ brushListState }
                        setState={ setBrushListState }
                    />
                }

            </div>
        
        </UI.HeaderAndBody>

    </div>
}