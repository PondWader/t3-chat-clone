import { Database } from "@t3-chat-clone/db/server";
import { chat, chatMessage } from "@t3-chat-clone/stores";

export function subscribeToEvents(db: Database) {
    db.subscribe(chat, e => {
        if (e.action === 'remove') {
            // TODO: Remove all associated messages
        }
    })

    db.subscribe(chatMessage, e => {
        if (e.action === 'push') {
            // TODO: Generate response
        }
    })
}