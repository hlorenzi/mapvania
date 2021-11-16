import * as React from "react"
import * as Project from "./project"
import { UpdateToken } from "./util/updateToken"
import { deepAssign, DeepAssignable } from "./util/deepAssign"


export interface Global
{
    project: Project.Project
    projectToken: UpdateToken

    editingLayerId: Project.ID
    editingToken: UpdateToken
}


export const global: Global =
{
    project: null!,
    projectToken: null!,

    editingLayerId: -1,
    editingToken: null!,
}


export function deepAssignProject(value: DeepAssignable<Project.Project>)
{
    global.project = deepAssign(global.project, value)
    global.projectToken.commit()
}