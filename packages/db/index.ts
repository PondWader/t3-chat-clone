import type { ZodObject } from "zod/v4"
import z from "zod/v4";

export type Action = "create" | "update" | "delete";

export type Store<T> = {
    name: string
    schema: ZodObject
    indices: string[]
    validate(obj: T): void
}

export type CreateStoreOptions<T extends ZodObject> = {
    name: string
    type: 'event' | 'singular'
    schema: T
    indices?: Extract<keyof z.infer<T>, string>[]
    validateUpdate?(action: Action, object: z.infer<T>): void
}

export function createStore<T extends ZodObject>(opts: CreateStoreOptions<T>): Store<z.infer<T>> {
    return {
        name: opts.name,
        schema: opts.schema,
        indices: opts.indices as any as string[] ?? [],
        validate(obj) {
            this.schema.parse(obj);
            if (opts.validateUpdate) {
                opts.validateUpdate('create', obj);
            }
        }
    }
}

export type Event<T> = {
    action: Action
    object: T
}

export type storeObject<S> = S extends Store<infer T> ? T : never;