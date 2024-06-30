import * as Solid from "solid-js"
import * as Filesystem from "./data/filesystem.ts"


export const CtxFilesystem =
    Solid.createContext<Solid.Signal<Filesystem.Filesystem>>(null!)


export function useFilesystem(): Solid.Signal<Filesystem.Filesystem>
{
    return Solid.useContext(CtxFilesystem)!
}