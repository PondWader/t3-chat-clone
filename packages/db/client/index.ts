import { Event, Store } from "../index.js"
import { createEventSource, EventSource } from "../shared/events.js"
import { ClientHelloData } from "../shared/messages.js"
import { Connection } from "./Connection.js"
import { MemoryStore } from "./MemoryStore.js"
import { PersistentStore } from "./PersistentStore.js"

export type Subscription = {
    unsubscribe(): void
}

export type Client = {
    stores: Map<String, Store<any>>,
    conn: Connection,
    db: PersistentStore,
    memory: MemoryStore,
    subscribe<T>(store: Store<T>, handler: (event: Event<T>) => void): Subscription
    push<T>(store: Store<T>, object: T): void
    getAll<T>(store: Store<T>, key: keyof T, value: string): Promise<T[]>
}

export type CreateClientOptions = {
    wsUrl: string
    dbName: string
    stores: Store<any>[]
}

export function createClient(opts: CreateClientOptions): Client {
    const eventSource = createEventSource();

    const client: Client = {
        stores: new Map(opts.stores.map(s => [s.name, s])),
        conn: new Connection(opts.wsUrl, () => {
            return createClientHello(client);
        }),
        db: new PersistentStore(opts.dbName, opts.stores),
        memory: new MemoryStore(),

        push(store, object) {
            store.validateClientAction('push', object);

            client.memory.insert(store, object);

            eventSource.publish(store, {
                action: "push",
                user: "",
                id: crypto.randomUUID(),
                object
            })

            this.conn.send({
                type: "push",
                data: {
                    id: "",
                    store: store.name,
                    object
                }
            })
        },
        getAll(store, key, value) {
            return this.db.getAll(store, key, value);
        },
        subscribe: eventSource.subscribe
    };

    bindConn(client, eventSource);

    return client;
}

function bindConn(client: Client, eventSource: EventSource) {
    client.conn.on('push', data => {
        const store = client.stores.get(data.store);
        if (!store) {
            throw new Error(`Missing store ${data.store}.`);
        }

        client.db.insert(store, {
            $id: data.id,
            ...data
        });
        eventSource.publish(store, {
            action: "push",
            user: "",
            id: data.id,
            object: data.object
        })
    })
    client.conn.on('remove', data => {

    })
    client.conn.on('clear', data => {
        const store = client.stores.get(data.store);
        if (!store) {
            throw new Error(`Missing store ${data.store}.`);
        }

        client.db.clear(store);
    })
    client.conn.on('partial', data => {

    })
}

async function createClientHello(client: Client): Promise<ClientHelloData> {
    const syncStatus: Record<string, string | null> = {};

    for (const store of client.stores.values()) {
        const lastStore = await client.db.getLast(store, "$id");
        syncStatus[store.name] = lastStore ? lastStore.id : null;
    }

    return {
        syncStatus
    }
}

function resetMemory() {

}