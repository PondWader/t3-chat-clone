import { Store } from "../index.js";

export type PersistentStoreObject<T> = T & { $id: string };

export class PersistentStore {
    #db?: IDBDatabase;
    #openQueue: (() => void)[] = [];

    #lockQueue: (() => void)[] = [];
    #locked = false;

    #onError?: (err: any) => void

    constructor(dbName: string, stores: Store<any>[], onError?: (err: any) => void) {
        this.#onError = onError;
        const request = window.indexedDB.open(dbName, 1);
        request.onerror = (event) => {
            console.error(`Failed to open IndexedDB database: ${(event.target as any).error?.message}`);
            alert("Failed to open IndexedDB database. This website will not behave as expected.");
        };
        request.onsuccess = (event) => {
            this.#db = (event.target as any).result as IDBDatabase;

            for (const cb of this.#openQueue) {
                cb();
            }
            this.#openQueue = [];
        };
        request.onupgradeneeded = (event) => {
            const db = (event.target as any).result as IDBDatabase;
            this.#init(db, stores);
        }
    }

    #init(db: IDBDatabase, stores: Store<any>[]) {
        for (const store of stores) {
            const objectStore = db.createObjectStore(store.name, {
                keyPath: '$id'
            });
            for (const i of store.indices) {
                objectStore.createIndex(i, i, { unique: false });
            }
            objectStore.createIndex('$msgId', '$msgId')
        }
    }

    #acquireTransaction(storeNames: string | string[], mode: IDBTransactionMode, options?: IDBTransactionOptions): Promise<IDBTransaction> {
        return new Promise((resolve) => {
            if (this.#db === undefined) {
                this.#openQueue.push(() => {
                    resolve(this.#acquireTransaction(storeNames, mode, options));
                })
                return
            }

            const transaction = this.#db.transaction(storeNames, mode);
            resolve(transaction);
        })
    }

    #acquireLockTransaction<T>(storeNames: string | string[], mode: IDBTransactionMode, cb: (t: IDBTransaction) => Promise<T> | T, options?: IDBTransactionOptions): Promise<T> {
        return new Promise(async (resolve, reject) => {
            if (this.#locked) {
                await new Promise<void>(resolve => this.#lockQueue.push(resolve));
            }
            this.#locked = true;

            try {
                const transaction = await this.#acquireTransaction(storeNames, mode, options);
                resolve(await cb(transaction));
            } catch (err) {
                if (this.#onError) {
                    this.#onError(err);
                }
                reject(err);
            }

            const next = this.#lockQueue.shift();
            if (next !== undefined) {
                next();
            } else {
                this.#locked = false;
            }
        })
    }

    insert<T>(store: Store<T>, ...obj: PersistentStoreObject<T>[]): Promise<void> {
        return this.#acquireLockTransaction(store.name, "readwrite", tx => {
            return new Promise(async (resolve, reject) => {
                tx.onerror = (e) => {
                    reject((e.target as any).error);
                }
                tx.oncomplete = () => {
                    resolve();
                }

                const objectStore = tx.objectStore(store.name);

                for (const o of obj) {
                    objectStore.put(o);
                }
            })
        })
    }

    getAll<T>(store: Store<T>, key: keyof PersistentStoreObject<T>, value: any): Promise<PersistentStoreObject<T>[]> {
        if (typeof key !== 'string' || !this.#isIndex(store, key)) throw new Error(`Key "${key.toString()}" is not an index in store.`);

        return this.#acquireLockTransaction(store.name, "readonly", tx => {
            return new Promise(async (resolve, reject) => {
                const objectStore = tx.objectStore(store.name);

                let request;
                if (key === '$id') {
                    request = objectStore.getAll(value);
                } else {
                    const index = objectStore.index(key);
                    request = index.getAll(value);
                }

                request.onsuccess = () => {
                    resolve(request.result);
                }
                request.onerror = (e) => {
                    reject((e.target as any).error)
                }
            })
        })
    }

    getLast<T>(store: Store<T>, key: keyof PersistentStoreObject<T>): Promise<PersistentStoreObject<T> | null> {
        if (typeof key !== 'string' || !this.#isIndex(store, key)) throw new Error(`Key "${key.toString()}" is not an index in store.`);

        return this.#acquireLockTransaction(store.name, "readonly", tx => {
            return new Promise(async (resolve, reject) => {
                const objectStore = tx.objectStore(store.name);

                let cursor;
                if (key === '$id') {
                    cursor = objectStore.openCursor(null, "prev");
                } else {
                    const index = objectStore.index(key);
                    cursor = index.openCursor(null, "prev");
                }

                cursor.onsuccess = () => {
                    if (cursor.result === null) resolve(null);
                    else resolve(cursor.result.value);
                }
                cursor.onerror = (e) => {
                    reject((e.target as any).error)
                }
            })
        })
    }

    clear(store: Store<any>): Promise<void> {
        return this.#acquireLockTransaction(store.name, "readwrite", tx => {
            return new Promise(async (resolve, reject) => {
                const objectStore = tx.objectStore(store.name);

                const request = objectStore.clear();

                request.onsuccess = () => {
                    resolve();
                }
                request.onerror = (e) => {
                    reject((e.target as any).error)
                }
            })
        })
    }

    close() {
        if (this.#db) {
            this.#db.close()
        } else {
            this.#openQueue.push(() => this.close());
        }
    }

    #isIndex<T>(store: Store<T>, key: string) {
        return key === '$id' || store.indices.includes(key);
    }
}