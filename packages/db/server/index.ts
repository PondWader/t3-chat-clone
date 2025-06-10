import { WebSocketHandler } from "bun";
import { Action, Event, Store } from "../index.js";
import { connect, createMetaTables, createStoreTable, DatabaseDriverConn } from "./database.js";
import { createWsBinding } from "./websocket.js";
import { UserQueue } from "./UserQueue.js";
import { createEventSource } from "../shared/events.js";

export type Subscription = {
    unsubscribe(): void
}

export type Database = {
    stores: Map<string, Store<any>>
    dbConn: DatabaseDriverConn
    userQueue: UserQueue
    subscribe<T>(store: Store<T>, handler: (event: Event<T>) => void): Subscription
    bindWebSocket(): WebSocketHandler<{ user: string; }>
    getSafeTableName(tableName: string): string

    push<T>(store: Store<T>, user: string, object: T): void
    remove(store: Store<any>, user: string, objectId: string): void
    getAll<T>(store: Store<T>, user: string, key: keyof T, value: string): Promise<T[]>
}

export type CreateDatabaseOptions = {
    dbUrl: string
    stores: Store<any>[]
}

export async function createDatabase(opts: CreateDatabaseOptions): Promise<Database> {
    const dbConn = connect(opts.dbUrl);

    await createMetaTables(dbConn);
    for (const store of opts.stores) {
        await createStoreTable(dbConn, store);
    }

    const eventSource = createEventSource();
    const userQueue = new UserQueue();

    return {
        stores: new Map(opts.stores.map(s => [s.name, s])),
        userQueue,
        dbConn,
        subscribe: eventSource.subscribe,
        bindWebSocket() {
            return createWsBinding(this);
        },
        getSafeTableName(tableName) {
            return '$' + tableName;
        },
        push(store, user, object) {
            if (!this.stores.has(store.name)) throw new Error(`Store "${store.name}" is not registered in the database.`);
            store.validate(object);

            return userQueue.syncUserAction(user, async () => {
                const id = Bun.randomUUIDv7();

                await dbConn.create(store.name, {
                    ...object as any,
                    $id: id,
                    $userId: user,
                    $deleted: 0
                })

                eventSource.publish(store, {
                    action: 'push',
                    user,
                    id,
                    object
                })
            })
        },
        remove(store, user, objectId) {
            if (!this.stores.has(store.name)) throw new Error(`Store "${store.name}" is not registered in the database.`);

            return userQueue.syncUserAction(user, async () => {
                await dbConn.transaction(async () => {
                    await dbConn.update(store.name, {
                        $id: objectId
                    }, {
                        $deleted: 1
                    })
                    await dbConn.create("$deletions", {
                        id: Bun.randomUUIDv7(),
                        store: store.name,
                        userId: user,
                        objectId
                    })
                });
            })
        },
        async getAll(store, user, key, value) {
            return [];
        },
    };
}
