import { Client, createClient } from "@t3-chat-clone/db/client";
import { account, chat, chatMessage } from "@t3-chat-clone/stores";
import { ComponentChild, createContext } from "preact";
import { useContext, useEffect, useMemo } from "preact/hooks";
import { useSignal, signal, useComputed } from "@preact/signals";
import type { storeObject, ObjectInstance } from "@t3-chat-clone/db";

const DBContext = createContext<Client | null>(null);

export function useDB(): Client {
    return useContext(DBContext)!;
}

export function useChat(chatId: string) {
    const db = useDB();
    const history = useMemo(() => signal<Map<string, ObjectInstance<storeObject<typeof chatMessage>>>>(new Map()), [chatId]);
    const sig = useMemo(() => signal([]), [chatId]);

    useEffect(() => {
        db.getAllMatches(chatMessage, 'chatId', chatId)
            .then(msgs => {
                msgs.filter(m => m.object.chatId === chatId)
                    .forEach(m => {
                        history.value.set(m.id, m);
                    });
                history.value = new Map(history.value);
            })

        const sub = db.subscribe(chatMessage, (e) => {
            if (e.action === 'clear') return history.value = new Map();
            if (e.object.chatId !== chatId) return;
            if (e.action === 'push') {
                history.value.set(e.id, e);
            } else if (e.action === 'remove') {
                history.value.delete(e.id);
            }
            history.value = new Map(history.value);
        })

        return () => sub.unsubscribe();
    }, [chatId]);

    return useComputed(() =>
        [...history.value.values()]
            .sort((a, b) => a.object.createdAt - b.object.createdAt)
    );
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