import { ZodObject } from "zod/v4";
import { Store } from "../index.js";
import { createSqliteConn } from "./drivers/sqlite.js";

export type ColumnType = "text" | "integer" | "real";

export type Column = {
    primaryKey?: boolean
    nullable?: boolean
    type: ColumnType
}

export type DatabaseDriverConn = {
    createTableIfNotExists(name: string, columns: { [name: string]: Column }): Promise<void>
    createIndexIfNotExists(tableName: string, column: string): Promise<void>
    query(tableName: string, conditions: { [name: string]: any }): Promise<unknown | null>
    create(tableName: string, columns: { [name: string]: any }): Promise<void>
}

export function connect(dbUrl: string): DatabaseDriverConn {
    const url = new URL(dbUrl);
    switch (url.protocol) {
        case "sqlite:":
            return createSqliteConn(url.hostname);
    }

    throw new Error(`"${url.protocol}" is not a supported database protocol.`)
}

const validNameRe = /^(_|[a-zA-Z])+$/

const specialColumns: Record<string, Column> = {
    "$id": {
        type: 'text'
    }
}

export async function createStoreTable(dbConn: DatabaseDriverConn, store: Store<any>) {
    if (!validNameRe.test(store.name)) throw new Error(`Store name "${store.name}" is not valid!`)

    zodSchemaToDbSchema(store.schema);

    for (const index of store.indices) {
        await dbConn.createIndexIfNotExists(store.name, index);
    }
}

function zodSchemaToDbSchema(schema: ZodObject): Record<string, Column> {
    const shape = schema.def.shape;
    for (const key in shape) {
        if (!validNameRe.test(key)) throw new Error(`Key name "${key}" is not valid!`);

        console.log(shape[key].def);
    }
    process.exit()
    return {}
}