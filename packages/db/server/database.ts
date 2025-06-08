import { createSqliteConn } from "./drivers/sqlite.js";

export type ColumnType = "text" | "integer" | "real";

export type Column = {
    primaryKey?: boolean
    nullable?: boolean
    type: ColumnType
}

export type DatabaseDriverConn = {
    createTableIfNotExists(name: string, columns: { [name: string]: Column }): void
    query(tableName: string, conditions: { [name: string]: any }): unknown
    create(tableName: string, columns: { [name: string]: any }): void
}

export function connect(dbUrl: string): DatabaseDriverConn {
    const url = new URL(dbUrl);
    switch (url.protocol) {
        case "sqlite:":
            return createSqliteConn(url.hostname);
    }

    throw new Error(`"${url.protocol}" is not a supported database protocol.`)
}