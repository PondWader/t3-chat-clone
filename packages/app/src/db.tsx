import { Client, createClient } from "@t3-chat-clone/db/client";
import { account, chat, chatMessage } from "@t3-chat-clone/stores";
import { ComponentChild, createContext } from "preact";
import { useContext, useEffect, useMemo } from "preact/hooks";
import { useSignal, signal, useComputed, computed } from "@preact/signals";
import type { storeObject, ObjectInstance, Store } from "@t3-chat-clone/db";

const DBContext = createContext<Client | null>(null);

export function useDB(): Client {
    return useContext(DBContext)!;
}

export function useChat(chatId: string) {
    const history = useStore(chatMessage, "chatId", chatId)

    return useMemo(() => computed(() =>
        [...history.value.values()]
            .sort((a, b) => a.object.createdAt - b.object.createdAt)
    ), [chatId]);
}

export function useChats() {
    return useStore(chat);
}

export function useStore<T>(store: Store<T>, key?: keyof T, value?: any) {
    const db = useDB();
    const items = useMemo(() => signal<Map<string, ObjectInstance<T>>>(new Map()), [store, key, value]);

    useEffect(() => {
        if (key) {
            db.getAllMatches(store, key, value)
                .then(objects => {
                    objects.filter(m => m.object[key] === value)
                        .forEach(m => {
                            items.value.set(m.id, m);
                        });
                    items.value = new Map(items.value);
                })
        } else {
            db.getAll(store)
                .then(objects => {
                    objects.forEach(m => {
                        items.value.set(m.id, m);
                    });
                    items.value = new Map(items.value);
                })
        }

        const sub = db.subscribe(store, (e) => {
            if (e.action === 'clear') return items.value = new Map();
            if (key && e.object[key] !== value) return;
            if (e.action === 'push' || e.action === 'partial') {
                items.value.set(e.id, e);
            } else if (e.action === 'remove') {
                items.value.delete(e.id);
            }
            items.value = new Map(items.value);
        })

        return () => sub.unsubscribe();
    }, [store, key, value]);

    return items;
}

export function useAccount() {
    const db = useDB();
    const signal = useSignal<storeObject<typeof account> | null>(null);

    useEffect(() => {
        db.getAll(account).then(acc => {
            if (acc.length !== 0) {
                signal.value = acc[0].object;
            }
        });

        const sub = db.subscribe(account, e => {
            if (e.action === 'push') {
                signal.value = e.object;
            } else if (e.action === 'remove' || e.action === 'clear') {
                signal.value = null;
            }
        })

        return () => sub.unsubscribe();
    }, []);

    return signal;
}

export function DBProvider(props: { children: ComponentChild }) {
    const wsUrl = ((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + "/api/db/ws";

    const client = createClient({
        wsUrl,
        dbName: 'app',
        stores: [
            account,
            chatMessage,
            chat
        ]
    });

    return <DBContext.Provider value={client}>
        {props.children}
    </DBContext.Provider>
}