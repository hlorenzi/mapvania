import * as React from "react"
import styled from "styled-components"
import * as MapEditor from "../mapEditor"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"
import * as ID from "../data/id"
import * as Properties from "../data/properties"
import * as UI from "../ui"
import { global } from "../global"
import { PropertyValuesPanel } from "./PropertyValuesPanel"


export function ObjectProperties(props: {
    editorIndex: number,
})
{
    const editor = global.editors.editors[props.editorIndex] as Editors.EditorMap
    const room = editor.map.rooms[editor.mapEditor.roomId]
    if (!room)
        return null

    const layer = Map.getRoomLayer(
        editor.map,
        editor.mapEditor.roomId,
        global.editors.mapEditing.layerDefId)
    
    if (!layer || layer.type !== "object")
        return null

    const objectSelection = [...editor.mapEditor.objectSelection]
    if (objectSelection.length == 0)
        return null

    const objectDefIdsSet = new Set<ID.ID>()
    objectSelection.forEach(id => objectDefIdsSet.add(layer.objects[id].objectDefId))

    const objectDefIds = [...objectDefIdsSet]
    const objectDefs = objectDefIds
        .map(id => Defs.getObjectDef(editor.defs, id)!)
        .filter(def => !!def)

    const propertiesDef = Properties.getDefsIntersection(
        objectDefs.map(def => Defs.getObjectPropertyDefs(editor.defs, def)))

    const properties = objectSelection.map(id => layer.objects[id].properties)

    const setProperties = (modifyFn: (values: Properties.PropertyValues) => Properties.PropertyValues) =>
    {
        const layer = Map.getRoomLayer(
            editor.map,
            editor.mapEditor.roomId,
            global.editors.mapEditing.layerDefId)
        
        if (!layer || layer.type !== "object")
            return
        
        const newLayer: Map.LayerObject = {
            ...layer,
            objects: {
                ...layer.objects,
            }
        }
        
        for (const objectId of objectSelection)
        {
            const object = layer.objects[objectId]
            const newObject = {
                ...object,
                properties: modifyFn(object.properties),
            }

            newLayer.objects[objectId] = newObject
        }

        editor.map = Map.setRoomLayer(
            editor.map,
            editor.mapEditor.roomId,
            layer.layerDefId,
            newLayer)

        global.editors.refreshToken.commit()
    }


    return <div style={{
        height: "100%",
        minHeight: "0",
        borderRadius: "0.5em",
        contain: "paint",
        pointerEvents: "auto",
        backgroundColor: "#242424",
    }}>
        <UI.HeaderAndBody
            header="OBJECT PROPERTIES"
        >
            <div style={{
                width: "100%",
                height: "100%",
                minHeight: "0",

                gridTemplate: "auto 1fr / 1fr",
            }}>

                <UI.Grid template="auto 1fr" fullHeight style={{
                    padding: "1em",
                }}>

                    <UI.Cell span={ 2 } justifyStart>
                        {
                            objectSelection.length +
                            " object" +
                            (objectSelection.length == 1 ? "" : "s") +
                            " selected"
                        }
                    </UI.Cell>

                    <UI.Cell span={ 2 } justifyStretch>
                        
                        <PropertyValuesPanel
                            key={ objectSelection.join(",") }
                            defProperties={ propertiesDef }
                            properties={ properties }
                            setProperties={ setProperties }
                        />

                    </UI.Cell>

                </UI.Grid>

            </div>
        
        </UI.HeaderAndBody>

    </div>
}