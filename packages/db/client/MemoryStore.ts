import { Store } from "../index.js";

export type MemoryStoreObject<T> = T & { $msgId: string };

export class MemoryStore {
    #stores: Map<string, MemoryStoreObject<any>[]> = new Map();

    insert<T>(store: Store<T>, ...obj: MemoryStoreObject<T>[]): void {
        if (!this.#stores.has(store.name)) this.#stores.set(store.name, [...obj]);
        else {
            const storeMem = this.#stores.get(store.name)!;
            storeMem.push(...obj);
        }
    }

    remove<T>(store: Store<T>, key: keyof T, value: string): void {
        if (!this.#stores.has(store.name)) return
        this.#stores.set(store.name,
            this.#stores.get(store.name)!.filter(o => o[key] !== value)
        )
        return;
    }

    getFirst<T>(store: Store<T>, key: keyof T, value: string): MemoryStoreObject<T> | null {
        if (!this.#stores.has(store.name)) return null
        return this.#stores.get(store.name)!
            .find(v => v[key] === value);
    }


    getAll<T>(store: Store<T>, key: keyof T, value: string): MemoryStoreObject<T>[] {
        if (!this.#stores.has(store.name)) return [];
        return this.#stores.get(store.name)!
            .filter(v => v[key] === value);
    }

    getLast<T>(store: Store<T>, key: keyof MemoryStoreObject<T>): MemoryStoreObject<T> | null {
        if (!this.#stores.has(store.name)) return null;
        const objs = this.#stores.get(store.name)!;
        if (objs.length === 0) return null;
        return objs.sort((a, b) => {
            const v1 = a[key], v2 = b[key];
            return v1 > v2 ? 1 : v1 === v2 ? 0 : -1;
        })[objs.length - 1];
    }

    clear(store: Store<any>): void {
        this.#stores.set(store.name, []);
    }
}