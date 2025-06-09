import { Client, createClient } from "@t3-chat-clone/db/client";
import { account, chatMessage } from "@t3-chat-clone/stores";
import { ComponentChild, createContext } from "preact";
import { useContext, useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { storeObject } from "@t3-chat-clone/db";

const DBContext = createContext<Client | null>(null);

export function useDB(): Client {
    return useContext(DBContext)!;
}

export function useChat(chatId: string) {
    const db = useDB();
    const signal = useSignal<storeObject<typeof chatMessage>[]>([]);

    useEffect(() => {
        db.getAll(chatMessage, 'chatId', chatId)
            .then(msgs => {
                // TODO: Sort by created ats
                signal.value = msgs;
            })

        const sub = db.subscribe(chatMessage, (e) => {
            // TODO: Update msgs
        })

        return () => {
            sub.unsubscribe();
        }
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
            chatMessage
        ]
    });

    return <DBContext.Provider value={client}>
        {props.children}
    </DBContext.Provider>
}