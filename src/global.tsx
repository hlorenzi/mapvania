import { RefreshToken } from "./util/refreshToken"
import * as Filesystem from "./data/filesystem"


export interface Global
{
    filesystem: Filesystem.Global
}


export let global: Global = null!


export function initGlobal(
    filesystemRefreshToken: RefreshToken,
)
{
    global = {
        filesystem: Filesystem.makeNew(filesystemRefreshToken),
    }
}