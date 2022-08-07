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
import { InputImagePicker } from "./InputImagePicker"
import { useCachedState } from "../util/useCachedState"


export function DefsTilesets(props: {
    editorIndex: number,
})
{
    const defs = global.editors.editors[props.editorIndex].defs
    
    const [listState, setListState] = useCachedState(
        "DefsTilesets_ListState",
        UI.makeHierarchicalListState())

    const curTilesetId = listState.lastSelectedId
    const [curTileAttrbId, setCurTileAttrbId] = React.useState<ID.ID>("")

    const curTilesetIndex = defs.tilesetDefs.findIndex(t => t.id === curTilesetId)
    const curTileset = defs.tilesetDefs.find(t => t.id === curTilesetId)
    const curTilesetImg = Images.getImageLazy(curTileset?.imageSrc ?? "")
    

    const setDefs = (fn: (old: Defs.Defs) => Defs.Defs) =>
    {
        Editors.assignEditorDefs(props.editorIndex, fn)
    }


    const set = (tilesetDef: Defs.DefTileset) =>
    {
        setDefs(defs => ({
            ...defs,
            tilesetDefs: Hierarchy.setItem(
                defs.tilesetDefs,
                curTilesetIndex,
                tilesetDef),
        }))
    }


    const create = () =>
    {
        const [nextIds, id] = ID.getNextID(defs.nextIDs)
        const tilesetDef = Defs.makeNewTilesetDef(id)

        setDefs(defs => ({ ...defs, nextIDs: nextIds }))
        return tilesetDef
    }


    const chooseImage = async (rootRelativePath: string) =>
    {
        if (!curTileset)
            return

        const image = await Images.loadImage(rootRelativePath)
        if (!image)
            return

        set({
            ...curTileset,
            imageSrc: rootRelativePath,
            width: image.width,
            height: image.height,
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

            const newAttrbs = [...attrbs]
            newAttrbs.sort((a, b) => ID.compareIDs(a, b))
                
            curAttrbs = Defs.setTileAttributesForTile(
                curAttrbs,
                tileIndex,
                newAttrbs)

            set({
                ...curTileset,
                tileAttributes: curAttrbs,
            })
        }

        state.onMouseUp = () =>
        {
            global.editors.refreshToken.commit()
        }
    }


    return <UI.Grid template="15em 27em 1fr" templateRows="1fr" fullHeight alignStart>

        <UI.HierarchicalList<Defs.DefTileset>
            items={ defs.tilesetDefs }
            setItems={ fn => setDefs(defs => ({ ...defs, tilesetDefs: fn(defs.tilesetDefs) })) }
            createItem={ create }
            state={ listState }
            setState={ setListState }
            getItemIcon={ item => Defs.getTilesetDefIconElement(item) }
            getItemLabel={ item => item.name }
        />

        { curTileset && <UI.Grid template="1fr" templateRows="auto 1fr" fullHeight key={ curTileset.id }>
            
            <UI.Grid template="auto auto">

                <UI.Cell justifyEnd>
                    Name
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <UI.Input
                        value={ curTileset.name }
                        onChange={ (value) => set({ ...curTileset, name: value }) }
                        fullWidth
                    />
                </UI.Cell>

                <UI.Cell justifyEnd>
                    Folder
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <UI.Input
                        value={ Hierarchy.stringifyFolder(curTileset.folder) }
                        onChange={ (value) => set({ ...curTileset, folder: Hierarchy.parseFolder(value) }) }
                        fullWidth
                    />
                </UI.Cell>

                <UI.Cell justifyEnd>
                    ID
                </UI.Cell>

                <UI.Cell justifyStart>
                    { curTileset.id }
                </UI.Cell>

                <UI.Cell span={ 2 } divider/>

                <UI.Cell justifyEnd alignCenter>
                    Image
                </UI.Cell>

                <UI.Cell justifyStretch>
                    <InputImagePicker
                        value={ curTileset.imageSrc }
                        onChange={ chooseImage }
                        imageset={ Images.builtinTilesetImages }
                    />
                </UI.Cell>
                
                <UI.Cell justifyEnd>
                    Tile Size
                </UI.Cell>

                <UI.Cell>
                    <UI.Input
                        number
                        value={ curTileset.gridCellWidth }
                        onChangeNumber={ (value) => set({ ...curTileset, gridCellWidth: value }) }
                    />
                    { " × " }
                    <UI.Input
                        number
                        value={ curTileset.gridCellHeight }
                        onChangeNumber={ (value) => set({ ...curTileset, gridCellHeight: value }) }
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
                        onChangeNumber={ (value) => set({ ...curTileset, gridGapX: value }) }
                    />
                    { " × " }
                    <UI.Input
                        number
                        value={ curTileset.gridGapY }
                        onChangeNumber={ (value) => set({ ...curTileset, gridGapY: value }) }
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
                        onChangeNumber={ (value) => set({ ...curTileset, gridOffsetX: value }) }
                    />
                    { " × " }
                    <UI.Input
                        number
                        value={ curTileset.gridOffsetY }
                        onChangeNumber={ (value) => set({ ...curTileset, gridOffsetY: value }) }
                    />
                    { " px" }
                </UI.Cell>

                <UI.Cell span={ 2 } divider/>
                
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