import { Event, ObjectInstance, Store } from "../index.js"
import { createEventSource, EventSource } from "../shared/events.js"
import { ClientHelloData } from "../shared/messages.js"
import { Connection, SyncTimeoutError } from "./Connection.js"
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
    push<T>(store: Store<T>, object: T): PushResult<void>
    remove(store: Store<any>, id: string): Promise<void>
    get<T>(store: Store<T>, id: string): Promise<ObjectInstance<T> | null>
    getAll<T>(store: Store<T>): Promise<ObjectInstance<T>[]>
    getAllMatches<T>(store: Store<T>, key: keyof T, value: string): Promise<ObjectInstance<T>[]>
    editMemory<T>(store: Store<T>, id: string, object: Partial<T>): void
    reconnect(): void
}

export type CreateClientOptions = {
    wsUrl: string;
    dbName: string;
    stores: Store<any>[];
    timeoutMs?: number;
}

export function createClient(opts: CreateClientOptions): Client {
    const eventSource = createEventSource();
    const timeoutMs = opts.timeoutMs ?? 10_000;

    const client: Client = {
        stores: new Map(opts.stores.map(s => [s.name, s])),
        conn: new Connection(opts.wsUrl, () => {
            return createClientHello(client);
        }, timeoutMs),
        db: new PersistentStore(opts.dbName, opts.stores, err => {
            console.error('IndexedDB operation failed: ' + err.toString());
            alert('An IndexedDB operation failed (check browser console for more information). Reloading page...');
            client.db.close();
            window.location.reload();
        }),
        memory: new MemoryStore(),

        push(store, object) {
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

            return new PushResult(resolve => resolve(client.conn.send({
                type: "push",
                msgId,
                data: {
                    id: "",
                    store: store.name,
                    object: object as any
                }
            })), msgId)
        },
        async remove(store, id) {
            client.memory.deletions.add(id);
            const msgId = crypto.randomUUID();

            let object: ObjectInstance<any>;
            let p: Promise<void>
            const pObject = await this.db.get(store, '$id', id);
            if (pObject !== null) {
                object = recordToObjectInstance(pObject, "$id");

                p = client.conn.send({
                    type: "remove",
                    msgId,
                    data: {
                        store: store.name,
                        id
                    }
                })
            } else {
                const mObject = this.memory.getFirst(store, "$msgId", id);
                if (mObject === null) return;
                object = recordToObjectInstance(mObject, "$msgId");

                // wait for push from server, then send remove
                p = new Promise((resolve, reject) => {
                    const sub = client.subscribe(store, e => {
                        if (e.action === 'push' && e.ack === mObject.$msgId) {
                            sub.unsubscribe();
                            resolve(client.remove(store, e.id));
                            clearTimeout(timeout);
                        }
                    })

                    const timeout = setTimeout(() => {
                        sub.unsubscribe();
                        reject(SyncTimeoutError);
                    }, timeoutMs);
                })
            }

            eventSource.publish(store, {
                action: "remove",
                user: "",
                id,
                object,
                msgId
            })

            return p;
        },
        async get(this: Client, store, id) {
            let object: ObjectInstance<any>;
            const pObject = await this.db.get(store, '$id', id);
            if (pObject === null) {
                const mObject = this.memory.getFirst(store, "$msgId", id);
                if (mObject === null) return null;
                object = recordToObjectInstance(mObject, "$msgId")
            } else {
                object = recordToObjectInstance(pObject, "$id")
            }
            return object;
        },
        async getAll(store) {
            const objects = await this.db.getAll(store);
            const result = objects.map((o) => recordToObjectInstance(o, "$id"));
            result.push(...client.memory.getAll(store).map((o) => recordToObjectInstance(o, "$msgId")))

            const filtered = result.filter(o => !client.memory.deletions.has(o.id));
            if (store.type === 'singular') {
                return filtered.slice(-1);
            }
            return filtered;
        },
        async getAllMatches(store, key, value) {
            const objects = await this.db.getAll(store, key, value);
            const result = objects.map((o) => recordToObjectInstance(o, "$id"));
            result.push(...client.memory.getAll(store, key, value).map((o) => recordToObjectInstance(o, "$msgId")))

            const filtered = result.filter(o => !client.memory.deletions.has(o.id));
            if (store.type === 'singular') {
                return filtered.slice(-1);
            }
            return filtered;
        },
        editMemory<T>(store: Store<T>, id: string, object: Partial<T>): void {
            const memObj = client.memory.edit(store, id, object);
            if (memObj !== null) {
                eventSource.publish(store, {
                    action: 'push',
                    id,
                    object: memObj,
                    user: ""
                })
            }
        },
        subscribe: eventSource.subscribe,
        reconnect() {
            client.conn.reconnect();
        }
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
            ...data.object
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
            object: data.object,
            ack
        })
    })
    client.conn.on('remove', async (data, ack) => {
        const store = client.stores.get(data.store);
        if (!store) {
            throw new Error(`Missing store ${data.store}.`);
        }

        const object = await client.db.get(store, "$id", data.id);
        if (object === null) return;

        client.db.delete(store, data.id);

        delete object.$id;
        eventSource.publish(store, {
            action: "remove",
            id: data.id,
            user: "",
            object,
            ack
        })
    })
    client.conn.on('clear', (data, ack) => {
        const store = client.stores.get(data.store);
        if (!store) {
            throw new Error(`Missing store ${data.store}.`);
        }

        client.db.clear(store);

        eventSource.publish(store, {
            action: "clear",
            id: "",
            user: "",
            object: null,
            ack
        })
    })
    client.conn.on('partial', (data, ack) => {
        const store = client.stores.get(data.store);
        if (!store) {
            throw new Error(`Missing store ${data.store}.`);
        }

        eventSource.publish(store, {
            action: "partial",
            user: "",
            id: data.id,
            object: data.object,
            ack
        })
    })
}

async function createClientHello(client: Client): Promise<ClientHelloData> {
    const syncStatus: Record<string, string | null> = {};

    for (const store of client.stores.values()) {
        const lastStore = await client.db.getLast(store, "$id");
        syncStatus[store.name] = lastStore ? lastStore.$id : null;
    }

    return {
        syncStatus
    }
}

function recordToObjectInstance<T>(record: T, key: keyof T): ObjectInstance<any> {
    const id = record[key] as string;
    delete record[key];
    return {
        id,
        object: record
    }
}

export class PushResult<T> extends Promise<T> {
    constructor(cb: ConstructorParameters<typeof Promise<T>>[0], public id: string) {
        super(cb);
    }
}   