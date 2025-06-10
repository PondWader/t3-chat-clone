import { Column, Condition } from "../database.js";

const nameRe = /^(\$|_|[a-zA-Z])+$/;

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
    createIndexIfNotExists(tableName: string, indexName: string, column: string): string
    select(tableName: string, conditions: Record<string, Condition>, sort?: Record<string, 'asc' | 'desc'>): Query
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
                fields += `${colName} ${col.type.toUpperCase()}`
                if (!col.nullable) {
                    fields += ` NOT NULL`
                }
                fields += `, `
            }
            if (fields.length != 0) {
                fields = fields.slice(0, -2);
            }

            return `CREATE TABLE IF NOT EXISTS ${quoteName(name)} (${fields});`
        },
        createIndexIfNotExists(tableName: string, indexName: string, column: string) {
            if (!nameRe.test(tableName)) throw invalidNameError(tableName);
            if (!nameRe.test(indexName)) throw invalidNameError(indexName);
            if (!nameRe.test(column)) throw invalidNameError(column);

            return `CREATE INDEX ${quoteName(indexName)} ON ${quoteName(tableName)}(${quoteName(column)});`;
        },
        select(tableName: string, conditions: Record<string, Condition>, sort?: Record<string, 'asc' | 'desc'>) {
            if (!nameRe.test(tableName)) throw invalidNameError(tableName);

            let sql = `SELECT * FROM ${quoteName(tableName)}`;

            const cols = Object.keys(conditions)
            if (cols.length !== 0) {
                sql += ` WHERE `;
            }
            let i = 0;
            const bindings: any[] = [];
            for (const colName of cols) {
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

                sql += `${quoteName(colName)} ${op} ?${++i} `
            }

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