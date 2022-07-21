import { global } from "../global"
import * as Filesystem from "../data/filesystem"
import * as Defs from "../data/defs"
import * as DefsSerialization from "../data/defs_serialization"
import * as Editors from "../data/editors"


export const createDefFile =
{
    func: async () =>
    {
        const handle = await window.showSaveFilePicker({
            suggestedName: "project" + Filesystem.DEFS_EXTENSION,
            types: [
                {
                    description: "Mapvania Definition File",
                    accept: {
                        "text/json": [Filesystem.DEFS_EXTENSION],
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

            const defs = Defs.makeNew()
            const serDefs = DefsSerialization.serialize(defs)
            const serDefsText = DefsSerialization.stringify(serDefs)

            const writable = await handle.createWritable()
            await writable.write(serDefsText)
            await writable.close()

            await Filesystem.refreshEntries()

            await Editors.openEditorDefs(rootRelativePath)
        }
        catch (e)
        {
            console.error(e)
            window.alert("An error occurred!\n\n" + e)
        }
    }
}