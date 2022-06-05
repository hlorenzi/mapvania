import { global } from "../global"
import * as Filesystem from "../data/filesystem"
import * as Defs from "../data/defs"
import * as Map from "../data/map"
import * as Editors from "../data/editors"


export const createMapFile =
{
    func: async () =>
    {
        const handle = await window.showSaveFilePicker({
            suggestedName: "map.mvmap",
            types: [
                {
                    description: "Mapvania Map File",
                    accept: {
                        "text/json": [".mvmap", ".json"],
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

            const newMap = Map.makeNew()
            const newMapData = Map.stringify(newMap)

            const writable = await handle.createWritable()
            await writable.write(newMapData)
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