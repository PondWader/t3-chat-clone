import { Column, Condition } from "../database.js";

const nameRe = /^(\$|_|[a-zA-Z0-9])+$/;

export type CreateQueryCreatorOptions = {
    quotations: {
        names: string;
    }
}

export type Query = {
    sql: string;
    bindings: any[]
}

export type QueryCreator = {
    createTableIfNotExists(name: string, columns: { [name: string]: Column }): string
    createIndexIfNotExists(tableName: string, indexName: string, ...column: string[]): string
    select(tableName: string, conditions: Record<string, Condition>, sort?: Record<string, 'asc' | 'desc'>): Query
    delete(tableName: string, conditions: Record<string, Condition>): Query
    update(tableName: string, conditions: Record<string, Condition>, columns: Record<string, any>): Query
    insertInto(tableName: string, columns: { [name: string]: any }): Query
}

export function createQueryCreator(opts: CreateQueryCreatorOptions): QueryCreator {
    function quoteName(str: string) {
        const q = opts.quotations.names;
        return q + str + q;
    }

    return {
        createTableIfNotExists(name: string, columns: { [name: string]: Column }) {
            if (!nameRe.test(name)) throw invalidNameError(name);

            let fields = ``;
            for (const [colName, col] of Object.entries(columns)) {
                if (!nameRe.test(colName)) throw invalidNameError(colName);
                fields += `${quoteName(colName)} ${col.type.toUpperCase()}`
                if (!col.nullable) {
                    fields += ` NOT NULL`
                }
                if (col.primaryKey) {
                    fields += ` PRIMARY KEY`
                }
                fields += `, `
            }
            if (fields.length != 0) {
                fields = fields.slice(0, -2);
            }

            return `CREATE TABLE IF NOT EXISTS ${quoteName(name)} (${fields});`
        },
        createIndexIfNotExists(tableName: string, indexName: string, ...column: string[]) {
            if (!nameRe.test(tableName)) throw invalidNameError(tableName);
            if (!nameRe.test(indexName)) throw invalidNameError(indexName);
            column.forEach(c => {
                if (!nameRe.test(c)) throw invalidNameError(c);
            })

            return `CREATE INDEX IF NOT EXISTS ${quoteName(indexName)} ON ${quoteName(tableName)}(${column.map(v => quoteName(v)).join(', ')});`;
        },
        select(tableName: string, conditions: Record<string, Condition>, sort?: Record<string, 'asc' | 'desc'>) {
            if (!nameRe.test(tableName)) throw invalidNameError(tableName);

            let sql = `SELECT * FROM ${quoteName(tableName)}`;

            sql += ` WHERE `;
            const bindings: any[] = [];
            sql += matchConditions(conditions, bindings, quoteName);

            if (sort !== undefined && Object.keys(sort).length !== 0) {
                sql += 'ORDER BY ';
                for (const col in sort) {
                    const order = sort[col];
                    if (order !== 'asc' && order !== 'desc') throw new Error('Sort order must be "asc" or "desc".');
                    if (!nameRe.test(col)) throw invalidNameError(col);

                    sql += `${quoteName(col)} ${order} `
                }
            }

            return {
                sql,
                bindings
            };
        },
        update(tableName, conditions, columns) {
            if (!nameRe.test(tableName)) throw invalidNameError(tableName);

            const bindings: any[] = Object.values(columns);
            let sql = `UPDATE ${quoteName(tableName)} SET `
            let i = 0;
            for (const col in columns) {
                if (!nameRe.test(col)) throw invalidNameError(col);
                sql += `${quoteName(col)} = ?${++i}, `
            }
            if (i !== 0) sql = sql.slice(0, -2);

            sql += " WHERE " + matchConditions(conditions, bindings, quoteName) + ";";

            return {
                sql,
                bindings
            }
        },
        delete(tableName, conditions) {
            const query = this.select(tableName, conditions);
            query.sql = 'DELETE' + query.sql.slice(8);
            return query;
        },
        insertInto(tableName: string, columns: { [name: string]: any }) {
            if (!nameRe.test(tableName)) throw invalidNameError(tableName);

            const cols = Object.keys(columns);
            cols.forEach(colName => {
                if (!nameRe.test(colName)) throw invalidNameError(colName);
            })

            let sql = `INSERT INTO ${quoteName(tableName)} (${cols.map(n => quoteName(n)).join(', ')}) VALUES (${new Array(cols.length).fill('?').join(', ')})`

            return {
                sql,
                bindings: Object.values(columns)
            }
        }
    }
}

function invalidNameError(name: string) {
    return new Error(`Model schema field name "${name}" is not valid.`)
}

function matchConditions(conditions: Record<string, Condition>, bindings: any[] = [], quoteName: (n: string) => string): string {
    let sql = '';
    const cols = Object.keys(conditions);
    for (let i = 0; i < cols.length; i++) {
        const colName = cols[i];
        if (!nameRe.test(colName)) throw invalidNameError(colName);

        let val = conditions[colName];
        let op = '=';
        if (typeof val === 'object') {
            if ('gt' in val) {
                val = val.gt;
                op = '>';
            } else if ('lt' in val) {
                val = val.lt;
                op = '<';
            } else if ('le' in val) {
                val = val.le;
                op = '<=';
            } else if ('ge' in val) {
                val = val.ge;
                op = '>=';
            }
        }
        bindings.push(val);
        sql += `${quoteName(colName)} ${op} ?${bindings.length}`
        if (i + 1 !== cols.length) sql += ` AND `
    }
    return sql;
}