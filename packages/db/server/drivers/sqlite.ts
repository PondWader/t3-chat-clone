import { Database } from "bun:sqlite";
import { Column, DatabaseDriverConn } from "../database.js";
import { createQueryCreator } from "./_sql.js";

export function createSqliteConn(filename: string): DatabaseDriverConn {
    const db = new Database(filename);
    // Enable WAL mode for faster writes (https://www.sqlite.org/wal.html)
    db.exec("PRAGMA journal_mode = WAL;");

    const queryCreator = createQueryCreator({
        quotations: {
            names: '`',
        }
    })

    return {
        createTableIfNotExists(name: string, columns: { [name: string]: Column }): void {
            db.exec(queryCreator.createTableIfNotExists(name, columns));
        },
        query(tableName: string, conditions: { [name: string]: any }): unknown {
            const q = queryCreator.select(tableName, conditions);
            return db.query(q.sql).get(...q.bindings);
        },
        create(tableName: string, columns: { [name: string]: any }): void {
            const q = queryCreator.insertInto(tableName, columns);
            db.exec(q.sql, ...q.bindings);
        }
    };
}