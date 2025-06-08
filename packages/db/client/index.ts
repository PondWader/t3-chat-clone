import { Store } from "../index.js"

export type CreateClientOptions = {
    wsUrl: string
    stores: Store<any>[]
}

export function createClient(opts: CreateClientOptions) {
    console.log(opts);
}