import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Filesystem from "../data/filesystem"
import * as Editors from "../data/editors"
import * as Images from "../data/images"
import * as Hierarchy from "../data/hierarchy"
import * as UI from "../ui"
import { global } from "../global"
import styled from "styled-components"
import { useCachedState } from "../util/useCachedState"
import { InputTilesetPicker } from "./InputTilesetPicker"


export function DefsTileBrushes(props: {
    editorIndex: number,
})
{
    const editor = global.editors.editors[props.editorIndex]
    const defs = editor.defs

    const [listState, setListState] = useCachedState(
        "DefsTileBrushes_ListState",
        UI.makeHierarchicalListState())

    const curBrushId = listState.lastSelectedId
    const curBrushIndex = defs.tileBrushDefs.findIndex(l => l.id === curBrushId)
    const curBrush = defs.tileBrushDefs.find(l => l.id === curBrushId)
    const curTileset = Defs.getTileset(defs, curBrush?.tilesetDefId ?? "")
    
    const curTilesetImgPath = !curTileset ? "" :
        Filesystem.resolveRelativePath(
            editor.basePath,
            curTileset.imageSrc)
    
    const curTilesetImg = Images.getImageLazy(curTilesetImgPath)
    

    const setDefs = (fn: (old: Defs.Defs) => Defs.Defs) =>
    {
        Editors.assignEditorDefs(props.editorIndex, fn)
    }


    const setBrush = (brushDef: Defs.DefTileBrush) =>
    {
        setDefs(defs =>
        {
            const tileBrushDefs = Hierarchy.setItem(
                defs.tileBrushDefs,
                curBrushIndex,
                brushDef)
    
            if (tileBrushDefs === defs.tileBrushDefs)
                return defs
            
            return {
                ...defs,
                tileBrushDefs,
            }
        })
    }


    const create = () =>
    {
        const [nextIds, id] = ID.getNextID(defs.nextIDs)
        const tileBrush = Defs.makeNewTileBrushDef(id)

        setDefs(defs => ({ ...defs, nextIDs: nextIds }))
        return tileBrush
    }


    const renderTilesetImage = React.useMemo(() => (ctx: CanvasRenderingContext2D) =>
    {
        if (!curBrush || !curTileset || !curTilesetImg)
            return

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
                ctx.strokeStyle = "#ccc"
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

                ctx.fillStyle = "#f008"
                ctx.strokeStyle = "#fd8"
                
                for (let cx = 0; cx < 3; cx++)
                for (let cy = 0; cy < 3; cy++)
                {
                    const c = data.connections[cx + cy * 3]

                    const x1 = x + (cx + 0) * curTileset.gridCellWidth / 3
                    const x2 = x + (cx + 1) * curTileset.gridCellWidth / 3
                    const y1 = y + (cy + 0) * curTileset.gridCellHeight / 3
                    const y2 = y + (cy + 1) * curTileset.gridCellHeight / 3
                    const w = curTileset.gridCellWidth / 3
                    const h = curTileset.gridCellHeight / 3

                    if (c === Defs.BrushTileType.Full)
                    {
                        ctx.fillRect(x1, y1, w, h)
                        ctx.strokeRect(x1, y1, w, h)
                    }
                    else if (c === Defs.BrushTileType.DiagonalUL)
                    {
                        ctx.beginPath()
                        ctx.moveTo(x1, y1)
                        ctx.lineTo(x2, y1)
                        ctx.lineTo(x1, y2)
                        ctx.lineTo(x1, y1)
                        ctx.fill()
                        ctx.stroke()
                    }
                    else if (c === Defs.BrushTileType.DiagonalUR)
                    {
                        ctx.beginPath()
                        ctx.moveTo(x2, y1)
                        ctx.lineTo(x2, y2)
                        ctx.lineTo(x1, y1)
                        ctx.lineTo(x2, y1)
                        ctx.fill()
                        ctx.stroke()
                    }
                    else if (c === Defs.BrushTileType.DiagonalDL)
                    {
                        ctx.beginPath()
                        ctx.moveTo(x1, y2)
                        ctx.lineTo(x1, y1)
                        ctx.lineTo(x2, y2)
                        ctx.lineTo(x1, y2)
                        ctx.fill()
                        ctx.stroke()
                    }
                    else if (c === Defs.BrushTileType.DiagonalDR)
                    {
                        ctx.beginPath()
                        ctx.moveTo(x2, y2)
                        ctx.lineTo(x1, y2)
                        ctx.lineTo(x2, y1)
                        ctx.lineTo(x2, y2)
                        ctx.fill()
                        ctx.stroke()
                    }
                }
            }
        }

    }, [curBrush, curTileset, curTilesetImg])


    const onMouseDown = (state: UI.ImageViewState) =>
    {
        if (!curBrush || !curTileset)
            return

        let originalBrush = curBrush
        
        let drawnMultiple = false
        let lastDrawnTileIndex: number | null = null
        let lastDrawnConnection: number | null = null
        let erasing: boolean | null = null

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
                
            const connectionX = Math.min(2, Math.floor(
                (state.mouse.pos.x - tilePx.x) / (curTileset.gridCellWidth / 3)))
                
            const connectionY = Math.min(2, Math.floor(
                (state.mouse.pos.y - tilePx.y) / (curTileset.gridCellHeight / 3)))

            const connection = connectionX + connectionY * 3

            const subquadrantX = Math.min(2, Math.floor(
                (state.mouse.pos.x - tilePx.x) % (curTileset.gridCellWidth / 3) / (curTileset.gridCellWidth / 9)))
            
            const subquadrantY = Math.min(2, Math.floor(
                (state.mouse.pos.y - tilePx.y) % (curTileset.gridCellHeight / 3) / (curTileset.gridCellHeight / 9)))
            
            let data = Defs.getTileBrushData(
                originalBrush,
                tileIndex)

            if (erasing === null)
                erasing = data.connections[connection] !== Defs.BrushTileType.None

            const brushType =
                erasing ?
                    Defs.BrushTileType.None :
                !drawnMultiple && subquadrantX === 0 && subquadrantY === 0 ?
                    Defs.BrushTileType.DiagonalUL :
                !drawnMultiple && subquadrantX === 2 && subquadrantY === 0 ?
                    Defs.BrushTileType.DiagonalUR :
                !drawnMultiple && subquadrantX === 0 && subquadrantY === 2 ?
                    Defs.BrushTileType.DiagonalDL :
                !drawnMultiple && subquadrantX === 2 && subquadrantY === 2 ?
                    Defs.BrushTileType.DiagonalDR :
                Defs.BrushTileType.Full

            originalBrush = Defs.setTileBrushConnection(
                originalBrush,
                tileIndex,
                connection,
                brushType)

            if (!erasing &&
                !drawnMultiple &&
                lastDrawnTileIndex !== null &&
                lastDrawnConnection !== null)
            {
                if (tileIndex !== lastDrawnTileIndex ||
                    connection !== lastDrawnConnection)
                {
                    drawnMultiple = true
                    
                    originalBrush = Defs.setTileBrushConnection(
                        originalBrush,
                        lastDrawnTileIndex,
                        lastDrawnConnection,
                        Defs.BrushTileType.Full)
                }
            }

            setBrush(originalBrush)

            lastDrawnTileIndex = tileIndex
            lastDrawnConnection = connection
        }

        state.onMouseUp = () =>
        {
            global.editors.refreshToken.commit()
        }
    }


    return <UI.Grid template="15em 25em 1fr" templateRows="1fr" fullHeight alignStart>

        <UI.HierarchicalList<Defs.DefTileBrush>
            items={ defs.tileBrushDefs }
            setItems={ fn => setDefs(defs => ({ ...defs, tileBrushDefs: fn(defs.tileBrushDefs) })) }
            createItem={ create }
            state={ listState }
            setState={ setListState }
            getItemIcon={ item => Defs.getTileBrushDefIconElement(editor.basePath, defs, item) }
            getItemLabel={ item => item.name }
        />

        { curBrush && <UI.Grid template="1fr" templateRows="auto 1fr" fullHeight key={ curBrush.id }>
            
            <UI.Grid template="auto auto">

                <UI.Cell justifyEnd>
                    Name
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <UI.Input
                        value={ curBrush.name }
                        onChange={ (value) => setBrush({ ...curBrush, name: value }) }
                        fullWidth
                    />
                </UI.Cell>

                <UI.Cell justifyEnd>
                    Folder
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <UI.Input
                        value={ Hierarchy.stringifyFolder(curBrush.folder) }
                        onChange={ (value) => setBrush({ ...curBrush, folder: Hierarchy.parseFolder(value) }) }
                        fullWidth
                    />
                </UI.Cell>

                <UI.Cell justifyEnd>
                    ID
                </UI.Cell>

                <UI.Cell justifyStart>
                    { curBrush.id }
                </UI.Cell>

                <UI.Cell span={ 2 } divider/>

                <UI.Cell justifyEnd alignCenter>
                    Tileset
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <InputTilesetPicker
                        defs={ defs }
                        value={ curBrush.tilesetDefId }
                        basePath={ editor.basePath }
                        onChange={ (value) => setBrush({ ...curBrush, tilesetDefId: value }) }
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