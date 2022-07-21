import * as React from "react"
import * as ID from "../data/id"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"
import * as Images from "../data/images"
import * as Hierarchy from "../data/hierarchy"
import * as UI from "../ui"
import { global } from "../global"
import styled from "styled-components"
import { useCachedState } from "../util/useCachedState"


export function DefsTileBrushes(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs

    const [listState, setListState] = useCachedState(
        "DefsTileBrushes_ListState",
        UI.makeHierarchicalListState())

    const curBrushId = listState.lastSelectedId
    const curBrushIndex = defs.tileBrushDefs.findIndex(l => l.id === curBrushId)
    const curBrush = defs.tileBrushDefs.find(l => l.id === curBrushId)
    const curTileset = Defs.getTileset(defs, curBrush?.tilesetDefId ?? "")
    const curTilesetImg = Images.getImageLazy(curTileset?.imageSrc ?? "")
    

    const setDefs = (fn: (old: Defs.Defs) => Defs.Defs) =>
    {
        Editors.assignEditorDefs(props.editorIndex, fn)
    }


    const setBrush = (brushDef: Defs.DefTileBrush) =>
    {
        setDefs(defs => ({
            ...defs,
            tileBrushDefs: Hierarchy.setItem(
                defs.tileBrushDefs,
                curBrushIndex,
                brushDef),
        }))
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

            setBrush(originalBrush)
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
            getItemIcon={ item => Defs.getTileBrushDefIconElement(defs, item) }
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

                <UI.Cell justifyEnd>
                    Tileset ID
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <UI.Input
                        value={ curBrush.tilesetDefId }
                        onChange={ (value) => setBrush({ ...curBrush, tilesetDefId: value }) }
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