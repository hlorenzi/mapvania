import { global } from "../global"
import * as Filesystem from "../data/filesystem"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as MapSerialization from "../data/map_serialization"
import * as Editors from "../data/editors"


export const createMapFile =
{
    func: async () =>
    {
        const handle = await window.showSaveFilePicker({
            suggestedName: "map" + Filesystem.MAP_EXTENSION,
            types: [
                {
                    description: "Mapvania Map File",
                    accept: {
                        "text/json": [Filesystem.MAP_EXTENSION],
                    }
                },
            ]
        })
        if (!handle)
            return

        try
        {
            const rootRelativePath = await Filesystem.getRootRelativePath(handle)
            if (!rootRelativePath)
                throw "file not contained in root folder"

            const map = Map.makeNew()
            const serMap = MapSerialization.serialize(null!, map)
            const serMapText = Filesystem.stringify(serMap)

            const writable = await handle.createWritable()
            await writable.write(serMapText)
            await writable.close()

            await Filesystem.refreshEntries()

            await Editors.openEditorMap(rootRelativePath)
        }
        catch (e)
        {
            console.error(e)
            window.alert("An error occurred!\n\n" + e)
        }
    }
}