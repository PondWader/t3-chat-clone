import type { ZodObject } from "zod/v4"
import z from "zod/v4";
import { MessageType } from "./shared/messages";

export type Action = Exclude<Exclude<MessageType, "client_hello">, "server_ready">;

export type ObjectInstance<T> = {
    id: string,
    object: T
}

export type Event<T> = {
    action: Action;
    user: string;
    id: string;
    object: T;
    msgId?: string;
    ack?: string;
}

export type StoreType = 'event' | 'singular';

export type Store<T> = {
    name: string
    type: StoreType
    schema: ZodObject
    indices: string[]
    validate(object: T): void
    validateClientAction(action: Exclude<Action, "partial">, obj: T): void
    validateClientActionSafe(action: Exclude<Action, "partial">, obj: T): boolean
}

export type CreateStoreOptions<T extends ZodObject> = {
    name: string
    type: StoreType
    schema: T
    indices?: Extract<keyof z.infer<T>, string>[]
    validateClientAction?(action: Exclude<Action, "partial">, object: z.infer<T>): boolean
}

export function createStore<T extends ZodObject>(opts: CreateStoreOptions<T>): Store<z.infer<T>> {
    return {
        name: opts.name,
        type: opts.type,
        schema: opts.schema.strict(),
        indices: opts.indices as any as string[] ?? [],
        validate(obj) {
            this.schema.parse(obj);
        },
        validateClientAction(action: Exclude<Action, "partial">, obj) {
            this.validate(obj);
            if (opts.validateClientAction && !opts.validateClientAction(action, obj)) {
                throw new Error("Illegal store operation.");
            }
        },
        validateClientActionSafe(action, obj) {
            try {
                this.validateClientAction(action, obj);
                return true;
            } catch {
                return false;
            }
        },
    }
}
export type storeObject<S> = S extends Store<infer T> ? T : never;