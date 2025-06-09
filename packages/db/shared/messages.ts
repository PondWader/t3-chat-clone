export type MessageType = "client_hello" | "update" | "remove" | "partial"

export interface MessageDataMap {
    client_hello: ClientHelloData;
    update: UpdateData;
    remove: RemoveData;
    partial: PartialData;
}

export type Message<T extends MessageType> = {
    type: T;
    data: MessageDataMap[T];
};

export type ClientHelloData = {
    syncStatus: Record<string, string>
}

export type UpdateData = {
    store: string,
    object: Record<string, any>,
    id: string,
    clientId?: string
}

export type RemoveData = {
    store: string,
    id: string
}

export type PartialData = {
    store: string,
    object: Record<string, any>,
    id: string
}