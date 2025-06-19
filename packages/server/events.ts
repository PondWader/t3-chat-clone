import { Database } from "@t3-chat-clone/db/server";
import { chat, chatMessage, writerUpdate } from "@t3-chat-clone/stores";
import { groq } from "@ai-sdk/groq";
import { handleMessage } from "./chat";
import { handleWriterUpdate } from "./writer";


export function subscribeToEvents(db: Database) {
    db.subscribe(chat, e => {
        if (e.action === 'remove') {
            // TODO: Remove all associated messages
        }
    })

    db.subscribe(chatMessage, e => {
        if (e.action === 'push' && e.object.role === 'user' && e.msgId && !e.object.copied) {
            handleMessage(db, e.id, e.user, e.object);
        }
    })

    db.subscribe(writerUpdate, e => {
        if (e.action === 'push' && e.object.role === 'user' && e.msgId) {
            handleWriterUpdate(db, e.id, e.user, e.object);
        }
    })
}