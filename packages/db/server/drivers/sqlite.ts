import { Database } from "bun:sqlite";
import { Column, Condition, DatabaseDriverConn } from "../database.js";
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
        async createTableIfNotExists(name: string, columns: { [name: string]: Column }): Promise<void> {
            db.exec(queryCreator.createTableIfNotExists(name, columns));
        },
        async createIndexIfNotExists(tableName, ...column): Promise<void> {
            db.exec(queryCreator.createIndexIfNotExists(tableName, column.join(''), ...column));
        },
        async query(tableName: string, conditions: Record<string, Condition>, sort): Promise<unknown | null> {
            const q = queryCreator.select(tableName, conditions, sort);
            return db.query(q.sql).get(...q.bindings);
        },
        async queryAll(tableName: string, conditions: Record<string, Condition>, sort): Promise<unknown[]> {
            const q = queryCreator.select(tableName, conditions, sort);
            return db.query(q.sql).all(...q.bindings);
        },
        async create(tableName: string, columns: { [name: string]: any }): Promise<void> {
            const q = queryCreator.insertInto(tableName, columns);
            db.exec(q.sql, ...q.bindings);
        },
        async remove(tableName: string, conditions: Record<string, Condition>): Promise<void> {
            const q = queryCreator.delete(tableName, conditions);
            db.exec(q.sql, ...q.bindings);
        },
        async update(tableName, conditions, columns) {

        },
        async transaction(this: DatabaseDriverConn, cb) {
            db.exec("BEGIN TRANSACTION;")
            try {
                await cb();
            } catch (err) {
                db.exec("ROLLBACK;")
                throw err;
            }
            db.exec("COMMIT;")
        }
    };
}