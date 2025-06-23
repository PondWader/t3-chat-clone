import { Database } from "@t3-chat-clone/db/server";

export type KeyHandler = {
    storeKey(provider: string, key: string): Promise<void>;
    removeKey(provider: string): Promise<void>;
    getKey(provider: string): string | undefined;
    hasKey(provider: string): boolean;
};

export async function createKeyHandler(db: Database): Promise<KeyHandler> {
    const tableName = db.getSafeTableName('api_keys');
    await db.dbConn.createTableIfNotExists(tableName, {
        provider: {
            type: 'text',
            primaryKey: true
        },
        key: {
            type: 'text'
        }
    })

    const keys = await loadKeys(db, tableName);

    return {
        async storeKey(provider: string, key: string) {
            await db.dbConn.remove(tableName, {
                provider
            });
            await db.dbConn.create(tableName, {
                provider,
                key
            });
            keys.set(provider, key);
        },

        async removeKey(provider: string) {
            await db.dbConn.remove(tableName, {
                provider
            });
            keys.delete(provider);
        },

        getKey(provider: string) {
            return keys.get(provider);
        },

        hasKey(provider: string) {
            return keys.has(provider);
        }
    }
}

async function loadKeys(db: Database, tableName: string): Promise<Map<string, string>> {
    const records = await db.dbConn.queryAll(tableName, {});
    const keys = new Map(records.map((r: any) => ([r.provider, r.key])));
    return keys;
}   