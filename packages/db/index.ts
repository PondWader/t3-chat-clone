import type { ZodType } from "zod/v4"

export type Model = {}

export type CreateModelOptions = {
    name: string
    schema: {
        [x: string]: ZodType
    }
    singular: boolean
    editable: boolean
}

const databaseNameRe = /^[a-zA-Z]+$/;

export function createModel(opts: CreateModelOptions): Model {
    for (const fieldName of Object.keys(opts.schema)) {
        if (!databaseNameRe.test(fieldName)) {
            throw new Error(`Model schema field name "${fieldName}" is not valid.`);
        }
    }

    return {}
}
