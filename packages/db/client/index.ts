import { Event, Store } from "../index.js"
import { ClientHelloData } from "../shared/messages.js"
import { Connection } from "./Connection.js"
import { DataStore } from "./DataStore.js"

export type Subscription = {
    unsubscribe(): void
}

export type Client = {
    stores: Map<String, Store<any>>,
    conn: Connection,
    db: DataStore
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
    const subscriptions = new Map<Store<any>, ((event: Event<any>) => void)[]>();

    const client: Client = {
        stores: new Map(opts.stores.map(s => [s.name, s])),
        conn: new Connection(opts.wsUrl, () => {
            return createClientHello(client);
        }),
        db: new DataStore(opts.dbName, opts.stores),

        push(store, object) {
            store.validate(object);

            this.db.insert(store, object);
            this.conn.send({
                type: "update",
                data: {
                    id: "",
                    clientId: "",
                    store: "",
                    object: object as any
                }
            })
        },
        getAll(store, key, value) {
            return this.db.getAll(store, key, value);
        },
        subscribe(store, handler) {
            if (!subscriptions.has(store)) {
                subscriptions.set(store, []);
            }
            subscriptions.get(store)!.push(handler);

            return {
                unsubscribe() {
                    subscriptions.set(store, subscriptions.get(store)!.filter(v => {
                        return v !== handler;
                    }))
                }
            }
        }
    };

    bindConn(client);

    return client;
}

function bindConn(client: Client) {
    client.conn.on('update', data => {
        const store = client.stores.get(data.store);
        if (!store) {
            throw new Error(`Missing store ${data.store}.`);
        }

        client.db.insert(store, data);
    })
}

async function createClientHello(client: Client): Promise<ClientHelloData> {
    const syncStatus: Record<string, string | null> = {};

    for (const store of client.stores.values()) {
        const lastStore = await client.db.getLast(store, "id");
        syncStatus[store.name] = lastStore ? lastStore.id : null;
    }

    return {
        syncStatus
    }
}