import type { ZodObject } from "zod/v4"
import z from "zod/v4";

export type Action = "create" | "update" | "delete";

export type Store<T> = {
    schema: ZodObject
    validate(obj: T): void
}

export type CreateStoreOptions<T extends ZodObject> = {
    name: string
    type: 'event' | 'singular'
    schema: T
    validateUpdate?(action: Action, object: z.infer<T>): void
}

const databaseNameRe = /^[a-zA-Z]+$/;

export function createStore<T extends ZodObject>(opts: CreateStoreOptions<T>): Store<z.infer<T>> {
    for (const fieldName of Object.keys(opts.schema)) {
        if (!databaseNameRe.test(fieldName)) {
            throw new Error(`Model schema field name "${fieldName}" is not valid.`);
        }
    }

    return {
        schema: opts.schema,
        validate(obj) {
            this.schema.parse(obj);
            if (opts.validateUpdate) {
                opts.validateUpdate('create', obj);
            }
        }
    }
}
