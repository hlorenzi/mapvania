import * as Defs from "./defs"
import * as ID from "./id"
import * as Hierarchy from "./hierarchy"
import * as Images from "./images"
import * as Properties from "./properties"
import { global } from "../global"
import * as MathUtils from "../util/mathUtils"
import * as JsonUtils from "../util/json"


export type SerializedItem<T> = T &
{
    sortAfter?: ID.ID
}


export interface SerializedDefs extends Defs.Defs
{
    type: "defs"
    version: 2
    layerDefs: Hierarchy.Items<SerializedItem<Defs.DefLayer>>
    tilesetDefs: Hierarchy.Items<SerializedItem<Defs.DefTileset>>
    tileAttributeDefs: Hierarchy.Items<SerializedItem<Defs.DefTileAttribute>>
    tileBrushDefs: Hierarchy.Items<SerializedItem<Defs.DefTileBrush>>
    objectDefs: Hierarchy.Items<SerializedItem<Defs.DefObject>>
}


export function stringify(
    serDefs: SerializedDefs)
    : string
{
    const isMergeFriendly = serDefs.generalDefs.jsonExportType === "merge-friendly"

    const jsonGetOptions: JsonUtils.GetStringifyOptions = (path, parent, value) =>
    {
        if (isMergeFriendly)
        {
            if (path[0] === "nextIDs")
                return {
                    spacedFields: true,
                }

            if (path[0] === "tilesetDefs" &&
                path[2] === "tileAttributes" &&
                path.length === 3)
                return {
                    useMultilineArray: true,
                }

            if (path[0] === "objectDefs" &&
                path[2] === "properties" &&
                path[path.length - 1] === "choices")
                return {
                    useMultilineArray: true,
                }
        }

        return {}
    }

    return JsonUtils.stringify(
        serDefs,
        {
            sortFields: isMergeFriendly,
            minimize: serDefs.generalDefs.jsonMinimize,
            useTrailingCommas: serDefs.generalDefs.jsonUseTrailingCommas,
            useBareIdentifiers: serDefs.generalDefs.jsonUseBareIdentifiers,
        },
        jsonGetOptions)
}


export function serialize(
    defs: Defs.Defs)
    : SerializedDefs
{
    const serDefs: SerializedDefs = {
        type: "defs",
        version: 2,
        nextIDs: defs.nextIDs,
        generalDefs: defs.generalDefs,
        layerDefs: defs.layerDefs,
        tilesetDefs: defs.tilesetDefs,
        tileAttributeDefs: defs.tileAttributeDefs,
        tileBrushDefs: defs.tileBrushDefs,
        objectDefs: defs.objectDefs,
    }

    const isMergeFriendly = serDefs.generalDefs.jsonExportType === "merge-friendly"

    const setSortOrder = <T extends { id: ID.ID, sortAfter?: ID.ID }>(list: T[]) =>
    {
        list = list.map(i => ({ ...i }))

        if (!isMergeFriendly)
        {
            for (let i = 0; i < list.length; i++)
                delete list[i].sortAfter

            return list
        }
        
        for (let i = 0; i < list.length; i++)
            list[i].sortAfter = (i > 0 ? list[i - 1].id : "")

        list.sort((a, b) => ID.compareIDs(a.id, b.id))
        return list
    }

    serDefs.layerDefs = setSortOrder(serDefs.layerDefs)
    serDefs.tilesetDefs = setSortOrder(serDefs.tilesetDefs)
    serDefs.tileAttributeDefs = setSortOrder(serDefs.tileAttributeDefs)
    serDefs.tileBrushDefs = setSortOrder(serDefs.tileBrushDefs)
    serDefs.objectDefs = setSortOrder(serDefs.objectDefs)

    return serDefs
}


export function parse(
    serDefsText: string)
    : SerializedDefs
{
    return JsonUtils.parse(serDefsText)
}


export function deserialize(
    serDefs: SerializedDefs)
    : Defs.Defs
{
    if (serDefs.type !== "defs")
        throw "not a serialized defs file"

    const restoreSortOrder = <T extends { id: ID.ID, sortAfter?: ID.ID }>(list: T[]) =>
    {
        const sortIndices = new Map<ID.ID, number>()
        for (let i = 0; i < list.length; i++)
        {
            if (list[i].sortAfter === undefined)
            {
                sortIndices.set(list[i].id, i)
                continue
            }

            let countBefore = 0
            let idBefore = list[i].sortAfter
            while (idBefore)
            {
                countBefore++
                const itemBefore = list.find(i => i.id === idBefore)
                if (!itemBefore)
                    break
                
                idBefore = itemBefore.sortAfter
            }

            sortIndices.set(list[i].id, countBefore)
        }
            
        list.sort((a, b) => sortIndices.get(a.id)! - sortIndices.get(b.id)!)
        return list
    }

    serDefs.layerDefs = restoreSortOrder(serDefs.layerDefs)
    serDefs.tilesetDefs = restoreSortOrder(serDefs.tilesetDefs)
    serDefs.tileAttributeDefs = restoreSortOrder(serDefs.tileAttributeDefs)
    serDefs.tileBrushDefs = restoreSortOrder(serDefs.tileBrushDefs)
    serDefs.objectDefs = restoreSortOrder(serDefs.objectDefs)
    
    const defs = Defs.makeNew()

    defs.nextIDs = serDefs.nextIDs

    defs.generalDefs = {
        roomWidthMultiple: serDefs.generalDefs.roomWidthMultiple ?? 16,
        roomHeightMultiple: serDefs.generalDefs.roomHeightMultiple ?? 16,
        jsonExportType: serDefs.generalDefs.jsonExportType ?? "merge-friendly",
        jsonMinimize: serDefs.generalDefs.jsonMinimize ?? false,
        jsonUseTrailingCommas: serDefs.generalDefs.jsonUseTrailingCommas ?? true,
        jsonUseBareIdentifiers: serDefs.generalDefs.jsonUseBareIdentifiers ?? true
    }

    defs.layerDefs = serDefs.layerDefs
        .map(l => deserializeLayer(defs, serDefs, l))

    defs.tilesetDefs = serDefs.tilesetDefs
        .map(t => deserializeTileset(defs, serDefs, t))

    defs.tileAttributeDefs = serDefs.tileAttributeDefs
        .map(t => deserializeTileAttribute(defs, serDefs, t))

    defs.tileBrushDefs = serDefs.tileBrushDefs
        .map(t => deserializeTileBrush(defs, serDefs, t))

    defs.objectDefs = serDefs.objectDefs
        .map(o => deserializeObject(defs, serDefs, o))

    return defs
}


function deserializeLayer(
    defs: Defs.Defs,
    serDefs: SerializedDefs,
    serLayer: Defs.DefLayer)
    : Defs.DefLayer
{
    return {
        id: serLayer.id,
        name: serLayer.name ?? "",

        type: serLayer.type ?? "tile",
        gridCellWidth: serLayer.gridCellWidth ?? 16,
        gridCellHeight: serLayer.gridCellHeight ?? 16,
    }
}


function deserializeTileset(
    defs: Defs.Defs,
    serDefs: SerializedDefs,
    serTileset: Defs.DefTileset)
    : Defs.DefTileset
{
    const tileset = {
        id: serTileset.id,
        name: serTileset.name ?? "",
        folder: serTileset.folder ?? [],

        imageSrc: serTileset.imageSrc ?? "",

        width: serTileset.width ?? 0,
        height: serTileset.height ?? 0,
    
        gridCellWidth: serTileset.gridCellHeight ?? 16,
        gridCellHeight: serTileset.gridCellHeight ?? 16,
    
        gridGapX: serTileset.gridGapX ?? 0,
        gridGapY: serTileset.gridGapY ?? 0,
    
        gridOffsetX: serTileset.gridOffsetX ?? 0,
        gridOffsetY: serTileset.gridOffsetY ?? 0,
    
        tileAttributes: serTileset.tileAttributes ?? {},
    }

    // FIXME: Enforce these rules at serialization-time instead
    for (const key of Object.keys(tileset.tileAttributes))
    {
        if (tileset.tileAttributes[key].length === 0)
            delete tileset.tileAttributes[key]

        if (tileset.tileAttributes[key])
            tileset.tileAttributes[key].sort((a, b) => ID.compareIDs(a, b))
    }

    return tileset
}


function deserializeTileAttribute(
    defs: Defs.Defs,
    serDefs: SerializedDefs,
    serTileAttrb: Defs.DefTileAttribute)
    : Defs.DefTileAttribute
{
    return {
        id: serTileAttrb.id,
        name: serTileAttrb.name ?? "",

        label: serTileAttrb.label ?? "",
        color: serTileAttrb.color ?? "",
    }
}


function deserializeTileBrush(
    defs: Defs.Defs,
    serDefs: SerializedDefs,
    serTileBrush: Defs.DefTileBrush)
    : Defs.DefTileBrush
{
    return {
        id: serTileBrush.id,
        name: serTileBrush.name ?? "",
        folder: serTileBrush.folder ?? [],

        tilesetDefId: serTileBrush.tilesetDefId ?? "",
        tiles: serTileBrush.tiles ?? {},
    }
}


function deserializeObject(
    defs: Defs.Defs,
    serDefs: SerializedDefs,
    serObject: Defs.DefObject)
    : Defs.DefObject
{
    return {
        id: serObject.id,
        name: serObject.name ?? "",
        folder: serObject.folder ?? [],
        
        imageSrc: serObject.imageSrc ?? "",
        imageRect: serObject.imageRect ?? { x: 0, y: 0, width: 0, height: 0 },

        pivotPercent: serObject.pivotPercent ?? { x: 0, y: 0 },
        interactionRect: serObject.interactionRect ?? { x: 0, y: 0, width: 0, height: 0 },

        resizeable: serObject.resizeable ?? false,
        
        inheritPropertiesFromObjectDefs: serObject.inheritPropertiesFromObjectDefs ?? [],
        properties: serObject.properties ?? [],
    }
}