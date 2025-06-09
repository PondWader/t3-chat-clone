import { Store } from "../index.js";

export class DataStore {
    #db?: IDBDatabase;
    #openQueue: (() => void)[] = [];

    constructor(dbName: string, stores: Store<any>[]) {
        const request = window.indexedDB.open(dbName, 1);
        request.onerror = (event) => {
            console.error(`Failed to open IndexedDB database: ${(event.target as any).error?.message}`);
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
                keyPath: 'id'
            });
            for (const i of store.indices) {
                objectStore.index(i);
            }
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

    insert<T>(store: Store<T>, ...obj: T[]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const tx = await this.#acquireTransaction(store.name, "readwrite");
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
    }

    getAll<T>(store: Store<T>, key: keyof T, value: string): Promise<T[]> {
        if (typeof key !== 'string' || !store.indices.includes(key)) throw new Error(`Key "${key.toString()}" is not an index in store.`);

        return new Promise(async (resolve, reject) => {
            const tx = await this.#acquireTransaction(store.name, "readonly");

            const objectStore = tx.objectStore(store.name);

            const index = objectStore.index(key);
            const request = index.getAll(value);

            request.onsuccess = () => {
                resolve(request.result);
            }
            request.onerror = (e) => {
                reject((e.target as any).error)
            }
        })
    }

    getLast<T>(store: Store<T>, key: keyof T): Promise<T> {
        if (typeof key !== 'string' || !store.indices.includes(key)) throw new Error(`Key "${key.toString()}" is not an index in store.`);

        return new Promise(async (resolve, reject) => {
            const tx = await this.#acquireTransaction(store.name, "readonly");

            const objectStore = tx.objectStore(store.name);

            const index = objectStore.index(key);
            const cursor = index.openCursor(null, "prev");

            cursor.onsuccess = () => {
                resolve(cursor.result!.value);
            }
            cursor.onerror = (e) => {
                reject((e.target as any).error)
            }
        })
    }
}