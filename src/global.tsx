import { RefreshToken } from "./util/refreshToken"
import * as Filesystem from "./data/filesystem"
import * as Editors from "./data/editors"
import * as Images from "./data/images"


export interface Global
{
    filesystem: Filesystem.Global
    editors: Editors.Global
    images: Images.Global
}


export let global: Global = null!


export function initGlobal(
    filesystemRefreshToken: RefreshToken,
    editorsRefreshToken: RefreshToken,
    imagesRefreshToken: RefreshToken,
)
{
    global = {
        filesystem: Filesystem.makeNew(filesystemRefreshToken),
        editors: Editors.makeNew(editorsRefreshToken),
        images: Images.makeNew(imagesRefreshToken),
    }
}