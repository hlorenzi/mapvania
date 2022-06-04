import { global } from "../global"
import * as Filesystem from "../data/filesystem"
import * as Editors from "../data/editors"


export const save =
{
    func: async () =>
    {
        const editor = global.editors.editors[global.editors.currentEditor]
        
        if (editor.type === "defs")
            await Editors.saveEditorDefs(global.editors.currentEditor)
    }
}