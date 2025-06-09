import { WebSocketHandler } from "bun";
import { Action, Event, Store } from "../index.js";
import { connect, DatabaseDriverConn } from "./database.js";
import { createWsBinding } from "./websocket.js";

export type Subscription = {
    unsubscribe(): void
}

export type Database = {
    dbConn: DatabaseDriverConn
    subscribe<T>(store: Store<T>, handler: (event: Event<T>) => void): Subscription
    bindWebSocket(): WebSocketHandler
}

export type CreateDatabaseOptions = {
    dbUrl: string
    stores: Store<any>[]
}

export function createDatabase(opts: CreateDatabaseOptions): Database {
    const dbConn = connect(opts.dbUrl);


    return {
        dbConn,
        subscribe(userId, handler) {
            return {
                unsubscribe() { }
            }
        },
        bindWebSocket() {
            return createWsBinding(this);
        }
    };
}
