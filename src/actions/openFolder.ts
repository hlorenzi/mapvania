import { global } from "../global"
import * as Filesystem from "../data/filesystem"


export const openFolder =
{
    func: async () =>
    {
        const handle = await window.showDirectoryPicker({ id: "mainFolder" })
        if (!handle)
            return

        await Filesystem.setRootDirectory(handle)
    }
}