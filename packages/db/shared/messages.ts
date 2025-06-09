import { z } from "zod";

export type MessageType = "client_hello" | "update" | "remove" | "partial" | "clear"

export interface MessageDataMap {
    client_hello: ClientHelloData;
    update: UpdateData;
    remove: RemoveData;
    partial: PartialData;
    clear: ClearData;
}

export type Message<T extends MessageType> = {
    type: T;
    data: MessageDataMap[T];
};

export const clientHelloData = z.strictObject({
    syncStatus: z.record(z.string(), z.string().nullable())
})
export type ClientHelloData = z.infer<typeof clientHelloData>

export const updateData = z.strictObject({
    store: z.string(),
    object: z.record(z.string(), z.any()),
    id: z.string(),
    clientId: z.string().optional()
})
export type UpdateData = z.infer<typeof updateData>

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