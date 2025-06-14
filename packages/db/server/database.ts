import { ZodObject } from "zod/v4";
import { Store } from "../index.js";
import { createSqliteConn } from "./drivers/sqlite.js";

export type ColumnType = "text" | "integer" | "real";

export type Column = {
    primaryKey?: boolean
    nullable?: boolean
    unique?: boolean
    type: ColumnType
}

export type Condition = string | number | {
    gt: string | number
} | {
    lt: string | number
} | {
    le: string | number
} | {
    ge: string | number
}

export type DatabaseDriverConn = {
    createTableIfNotExists(name: string, columns: { [name: string]: Column }): Promise<void>
    createIndexIfNotExists(tableName: string, ...column: string[]): Promise<void>
    query(tableName: string, conditions: Record<string, Condition>, sort?: Record<string, 'asc' | 'desc'>): Promise<unknown | null>
    queryAll(tableName: string, conditions: Record<string, Condition>, sort?: Record<string, 'asc' | 'desc'>): Promise<unknown[]>
    create(tableName: string, columns: { [name: string]: any }): Promise<void>
    remove(tableName: string, conditions: Record<string, Condition>): Promise<void>
    update(tableName: string, conditions: Record<string, Condition>, columns: Record<string, any>): Promise<void>
    /**
     * Note: Transactions should only perform database operations and make no other asynchronous calls.
     * @param cb 
     */
    transaction(cb: () => Promise<void>): Promise<void>
}

export function connect(dbUrl: string): DatabaseDriverConn {
    const url = new URL(dbUrl);
    switch (url.protocol) {
        case "sqlite:":
            return createSqliteConn(url.hostname);
    }

    throw new Error(`"${url.protocol}" is not a supported database protocol.`)
}

const validNameRe = /^(_|[a-zA-Z0-9])+$/

export const specialColumns: Record<string, Column> = {
    "$id": {
        type: 'text',
        primaryKey: true
    },
    "$userId": {
        type: 'text'
    },
    "$deleted": {
        type: 'integer'
    }
}

export async function createMetaTables(dbConn: DatabaseDriverConn) {
    await dbConn.createTableIfNotExists('$deletions', {
        id: { type: 'text', primaryKey: true },
        store: { type: 'text' },
        userId: { type: 'text' },
        objectId: { type: 'text' }
    })

    await dbConn.createIndexIfNotExists('$deletions', 'id', 'store', 'userId');
}

export async function createStoreTable(dbConn: DatabaseDriverConn, store: Store<any>) {
    if (!validNameRe.test(store.name)) throw new Error(`Store name "${store.name}" is not valid!`)

    const dbSchema = zodSchemaToDbSchema(store.schema);
    await dbConn.createTableIfNotExists(store.name, dbSchema);

    for (const index of store.indices) {
        await dbConn.createIndexIfNotExists(store.name, index);
    }
}

function zodSchemaToDbSchema(schema: ZodObject): Record<string, Column> {
    const shape = schema.def.shape;
    const columns: Record<string, Column> = {
        ...specialColumns,
    };
    for (const key in shape) {
        if (!validNameRe.test(key)) throw new Error(`Key name "${key}" is not valid!`);
        columns[key] = zodDefToDbType(shape[key].def);
    }

    return columns
}

function zodDefToDbType(def: any): Column {
    if (def.type === 'string') {
        return { type: 'text' };
    } else if (def.type === 'nullable') {
        return { nullable: true, type: zodDefToDbType(def.innerType.def).type }
    } else if (def.type === 'number' && def.format === 'safeint' || def.format === 'int32' || def.format === 'int64') {
        return { type: 'integer' }
    } else if (def.type === 'number' && def.format === undefined) {
        return { type: 'real' };
    }
    throw new Error(`Unexpected Zod type found in store definition: "${def.type}"! Types should be numbers/integers/strings.`);
}

/**
 * Removes special columns from a database record
 * @param record 
 */
export function cleanRecord(record: any) {
    for (const colName of Object.keys(specialColumns)) {
        delete record[colName];
    }
}