import { WebSocketHandler } from "bun";
import { Action, Event, ObjectInstance, Store } from "../index.js";
import { cleanRecord, connect, createMetaTables, createStoreTable, DatabaseDriverConn } from "./database.js";
import { createWsBinding } from "./websocket.js";
import { UserQueue } from "./UserQueue.js";
import { createEventSource, EventSource } from "../shared/events.js";

export type Subscription = {
    unsubscribe(): void
}

export type PartialStream<T> = {
    update(obj: T): void
    final(obj: T): void
}

export type Database = {
    stores: Map<string, Store<any>>
    dbConn: DatabaseDriverConn
    userQueue: UserQueue
    subscribe<T>(store: Store<T>, handler: (event: Event<T>) => void): Subscription
    bindWebSocket(): WebSocketHandler<{ user: string; }>
    getSafeTableName(tableName: string): string

    push<T>(store: Store<T>, user: string, object: T, msgId?: string, id?: string): Promise<void>
    remove(store: Store<any>, user: string, objectId: string, msgId?: string): void
    getAll<T>(store: Store<T>, user: string, key: keyof T, value: any): Promise<ObjectInstance<T>[]>
    partial<T>(store: Store<T>, user: string): PartialStream<T>
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
        push(store, user, object, msgId, id) {
            if (!this.stores.has(store.name)) throw new Error(`Store "${store.name}" is not registered in the database.`);
            store.validate(object);

            return userQueue.syncUserAction(user, async () => {
                id = id ?? Bun.randomUUIDv7();

                if (store.type === 'singular') {
                    const existing = await dbConn.query(store.name, {
                        $userId: user
                    }) as any
                    if (existing !== null) {
                        id = existing.$id;
                        await dbConn.update(store.name, {
                            $id: existing.$id,
                            $userId: user
                        }, { ...object as any })
                    } else {
                        await dbConn.create(store.name, {
                            ...object as any,
                            $id: id,
                            $userId: user,
                            $deleted: 0
                        })
                    }
                } else {
                    await dbConn.create(store.name, {
                        ...object as any,
                        $id: id,
                        $userId: user,
                        $deleted: 0
                    })
                }

                eventSource.publish(store, {
                    action: 'push',
                    user,
                    id: id as string,
                    object,
                    msgId
                })
            })
        },
        remove(store, user, objectId, msgId) {
            if (!this.stores.has(store.name)) throw new Error(`Store "${store.name}" is not registered in the database.`);

            return userQueue.syncUserAction(user, async () => {
                await dbConn.transaction(async () => {
                    const object = await dbConn.query(store.name, {
                        $id: objectId
                    })
                    if (object === null) return;

                    await dbConn.update(store.name, {
                        $id: objectId,
                        $userId: user
                    }, {
                        $deleted: 1
                    })
                    await dbConn.create("$deletions", {
                        id: Bun.randomUUIDv7(),
                        store: store.name,
                        userId: user,
                        objectId
                    })
                    cleanRecord(object);

                    eventSource.publish(store, {
                        action: 'remove',
                        id: objectId,
                        user,
                        object,
                        msgId
                    })
                });
            })
        },
        async getAll<T>(store: Store<T>, user: string, key: keyof T, value: any) {
            const records = await dbConn.queryAll(store.name, { $userId: user, [key]: value }, { $id: "asc" }) as T[]
            return records.map((r: any) => {
                const id = r.$id;
                cleanRecord(r);
                return {
                    id,
                    object: r
                }
            });
        },
        partial(store, user) {
            return createPartialStream(this, eventSource, store, user)
        }
    };
}

function createPartialStream<T>(db: Database, eventSource: EventSource, store: Store<T>, user: string): PartialStream<T> {
    const id = Bun.randomUUIDv7();

    return {
        update(object) {
            eventSource.publish(store, {
                action: 'partial',
                user,
                id,
                object
            })
        },
        final(object) {
            db.push(store, user, object, undefined, id);
        },
    }
}