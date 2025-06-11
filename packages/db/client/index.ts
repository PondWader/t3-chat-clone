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
    push<T>(store: Store<T>, object: T): Promise<void>
    getAll<T>(store: Store<T>, key: keyof T, value: string): Promise<T[]>
}

export type CreateClientOptions = {
    wsUrl: string;
    dbName: string;
    stores: Store<any>[];
    timeoutMs?: number;
}

export function createClient(opts: CreateClientOptions): Client {
    const eventSource = createEventSource();

    const client: Client = {
        stores: new Map(opts.stores.map(s => [s.name, s])),
        conn: new Connection(opts.wsUrl, () => {
            return createClientHello(client);
        }, opts.timeoutMs ?? 10_000),
        db: new PersistentStore(opts.dbName, opts.stores),
        memory: new MemoryStore(),

        push(this: Client, store, object) {
            store.validateClientAction('push', object);

            const msgId = crypto.randomUUID();
            client.memory.insert(store, {
                ...object,
                $msgId: msgId
            });

            eventSource.publish(store, {
                action: "push",
                user: "",
                id: msgId,
                object,
                msgId
            })

            return this.conn.send({
                type: "push",
                msgId,
                data: {
                    id: "",
                    store: store.name,
                    object: object as any
                }
            })
        },
        getAll(this: Client, store, key, value) {
            return this.db.getAll(store, key, value);
        },
        subscribe: eventSource.subscribe
    };

    bindConn(client, eventSource);

    return client;
}

function bindConn(client: Client, eventSource: EventSource) {
    client.conn.on('push', (data, ack) => {
        const store = client.stores.get(data.store);
        if (!store) {
            throw new Error(`Missing store ${data.store}.`);
        }

        client.db.insert(store, {
            $id: data.id,
            ...data
        }).catch(err => {
            console.error('IndexedDB operation fialed: ' + err.toString());
            alert('An IndexedDB operation failed (check console for more information). Reloading page...');
            window.location.reload();
        });

        if (typeof ack === 'string') {
            const object = client.memory.getFirst(store, '$msgId', ack);
            if (object !== null) {
                client.memory.remove(store, '$msgId', ack);
                eventSource.publish(store, {
                    action: "remove",
                    user: "",
                    id: ack,
                    object
                })
            }
        }

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
