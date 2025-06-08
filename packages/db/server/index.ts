import { WebSocketHandler } from "bun";
import { Model } from "../index.js";
import { connect, DatabaseDriverConn } from "./database.js";
import { createWsBinding } from "./websocket.js";

export type Subscription = {
    unsubscribe(): void
}

export type Update = {

}

export type Database = {
    dbConn: DatabaseDriverConn
    subscribe(userId: string, handler: () => void): Subscription
    bindWebSocket(): WebSocketHandler
}

export type CreateDatabaseOptions = {
    dbUrl: string
    models: Model[]
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

