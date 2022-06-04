import { global } from "../global"
import * as Filesystem from "../data/filesystem"
import * as Defs from "../data/defs"
import * as Editors from "../data/editors"


export const createDefFile =
{
    func: async () =>
    {
        const handle = await window.showSaveFilePicker({
            suggestedName: "project.mvdefs",
            types: [
                {
                    description: "Mapvania Definition File",
                    accept: {
                        "text/json": [".mvdefs", ".json"],
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

            const newDefs = Defs.makeNew()
            const newDefsData = Defs.stringify(newDefs)

            const writable = await handle.createWritable()
            await writable.write(newDefsData)
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