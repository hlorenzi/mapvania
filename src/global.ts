import * as React from "react"
import { Project } from "./project"
import { UpdateToken } from "./util/updateToken"
import { deepAssign, DeepAssignable } from "./util/deepAssign"


export interface Global
{
    project: Project
    projectToken: UpdateToken
}


export const global: Global =
{
    project: null!,
    projectToken: null!,
}


export function deepAssignProject(value: DeepAssignable<Project>)
{
    global.project = deepAssign(global.project, value)
    global.projectToken.commit()
}