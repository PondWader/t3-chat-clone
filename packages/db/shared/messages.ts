import { z } from "zod/v4";

export type MessageType = "client_hello" | "server_ready" | "push" | "remove" | "partial" | "clear"

export interface MessageDataMap {
    client_hello: ClientHelloData;
    server_ready: {}
    push: PushData;
    remove: RemoveData;
    partial: PartialData;
    clear: ClearData;
}

export type Message<T extends MessageType> = {
    type: T;
    ack?: string;
    msgId?: string;
    data: MessageDataMap[T];
};

export const clientHelloData = z.strictObject({
    syncStatus: z.record(z.string(), z.string().nullable())
})
export type ClientHelloData = z.infer<typeof clientHelloData>

export const pushData = z.strictObject({
    store: z.string(),
    object: z.record(z.string(), z.any()),
    id: z.string()
})
export type PushData = z.infer<typeof pushData>

export const removeData = z.strictObject({
    store: z.string(),
    id: z.string()
})
export type RemoveData = z.infer<typeof removeData>

export const partialData = z.strictObject({
    store: z.string(),
    object: z.record(z.string(), z.any()),
    id: z.string()
})
export type PartialData = z.infer<typeof partialData>

export const clearData = z.strictObject({
    store: z.string()
})
export type ClearData = {
    store: string;
}