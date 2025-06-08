import { Column } from "../database.js";

const nameRe = /^(_|[a-zA-Z])+$/;

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
    select(tableName: string, conditions: { [name: string]: any }): Query
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

            return `CREATE TABLE ${quoteName(name)} (${fields});`
        },
        select(tableName: string, conditions: { [name: string]: any }) {
            if (!nameRe.test(tableName)) throw invalidNameError(tableName);

            let sql = `SELECT * FROM ${quoteName(tableName)}`;

            const cols = Object.keys(conditions)
            if (cols.length !== 0) {
                sql += ` WHERE `;
            }
            let i = 0;
            for (const colName of cols) {
                if (!nameRe.test(colName)) throw invalidNameError(colName);
                sql += `${quoteName(colName)} = ?${++i}`
            }

            return {
                sql,
                bindings: Object.values(conditions)
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