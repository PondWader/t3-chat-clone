import { Client, createClient } from "@t3-chat-clone/db/client";
import { account, chat, chatMessage, settings } from "@t3-chat-clone/stores";
import { ComponentChild, createContext } from "preact";
import { useContext, useEffect, useMemo } from "preact/hooks";
import { useSignal, signal, useComputed, computed } from "@preact/signals";
import type { storeObject, ObjectInstance, Store } from "@t3-chat-clone/db";

const DBContext = createContext<Client | null>(null);

export function useDB(): Client {
    return useContext(DBContext)!;
}

const chatCache = new Map<string, Map<string, ObjectInstance<any>>>();

export function useChat(chatId: string | null) {
    if (chatId === null) return useSignal([]);

    const history = useStore(chatMessage, "chatId", chatId, chatCache.get(chatId))

    return useMemo(() => computed(() => {
        if (history.value.size < 32) {
            if (chatCache.size > 5) {
                chatCache.delete(chatCache.keys().next().value!)
            }
            chatCache.set(chatId, history.value);
        } else {
            chatCache.delete(chatId);
        }

        return [...history.value.values()]
            .sort((a, b) => a.object.createdAt - b.object.createdAt);
    }), [chatId]);
}

export function useChats() {
    const chats = useStore(chat);
    return useComputed(() => [...chats.value.values()]);
}

export function useStore<T>(store: Store<T>, key?: keyof T, value?: any, init?: Map<string, ObjectInstance<T>>) {
    const db = useDB();
    const items = useMemo(() => signal<Map<string, ObjectInstance<T>>>(init ?? new Map()), [store, key, value]);

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

export function useSettings() {
    const db = useDB();
    const signal = useSignal<storeObject<typeof settings>>({ openRouterKey: null });

    useEffect(() => {
        db.getAll(settings).then(acc => {
            if (acc.length !== 0) {
                signal.value = acc[0].object;
            }
        });

        const sub = db.subscribe(settings, e => {
            if (e.action === 'push') {
                signal.value = e.object;
            } else if (e.action === 'remove' || e.action === 'clear') {
                signal.value = { openRouterKey: null };
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
            settings,
            chatMessage,
            chat
        ]
    });

    return <DBContext.Provider value={client}>
        {props.children}
    </DBContext.Provider>
}