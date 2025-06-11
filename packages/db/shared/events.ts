import { Event, Store } from "../index.js";

export type EventSource = ReturnType<typeof createEventSource>

export function createEventSource() {
    const subscriptions = new Map<Store<any>, ((event: Event<any>) => void)[]>();

    return {
        subscribe<T>(store: Store<T>, handler: (event: Event<T>) => void) {
            if (!subscriptions.has(store)) {
                subscriptions.set(store, []);
            }
            subscriptions.get(store)!.push(handler);

            return {
                unsubscribe() {
                    subscriptions.set(store, subscriptions.get(store)!.filter(v => {
                        return v !== handler;
                    }))
                }
            }
        },
        publish<T>(store: Store<T>, event: Event<T>) {
            const subs = subscriptions.get(store);
            if (subs === undefined) return;

            for (const sub of subs) {
                sub(event);
            }
        }
    }
}