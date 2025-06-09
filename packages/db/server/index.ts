import { WebSocketHandler } from "bun";
import { Action, Event, Store } from "../index.js";
import { connect, DatabaseDriverConn } from "./database.js";
import { createWsBinding } from "./websocket.js";

export type EventContext = {
    user: string;
    push<T>(store: Store<T>, object: T): void
    getAll<T>(store: Store<T>, key: keyof T, value: string): Promise<T[]>
}

export type Subscription = {
    unsubscribe(): void
}

export type Database = {
    stores: Map<string, Store<any>>
    dbConn: DatabaseDriverConn
    subscribe<T>(store: Store<T>, handler: (event: Event<T>, ctx: EventContext) => void): Subscription
    bindWebSocket(): WebSocketHandler<{ user: string; }>
    getSafeTableName(tableName: string): string
}

export type CreateDatabaseOptions = {
    dbUrl: string
    stores: Store<any>[]
}

export function createDatabase(opts: CreateDatabaseOptions): Database {
    const dbConn = connect(opts.dbUrl);


    return {
        stores: new Map(opts.stores.map(s => [s.name, s])),
        dbConn,
        subscribe(userId, handler) {
            return {
                unsubscribe() { }
            }
        },
        bindWebSocket() {
            return createWsBinding(this);
        },
        getSafeTableName(tableName) {
            return '$' + tableName;
        }
    };
}
