import { Database } from "@t3-chat-clone/db/server";
import { chat, chatMessage } from "@t3-chat-clone/stores";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";

const bufferMs = 20;

export function subscribeToEvents(db: Database) {
    db.subscribe(chat, e => {
        if (e.action === 'remove') {
            // TODO: Remove all associated messages
        }
    })

    db.subscribe(chatMessage, async e => {
        if (e.action === 'push' && e.object.role === 'user') {
            const { textStream } = streamText({
                model: groq('llama-3.1-8b-instant'),
                messages: [
                    { role: 'user', content: e.object.content }
                ]
            });

            const stream = db.partial(chatMessage, e.user);

            let msg = '';
            const date = Date.now();
            let lastUpdate = 0;
            for await (const textPart of textStream) {
                msg += textPart;
                if (Date.now() - lastUpdate > bufferMs) {
                    stream.update({
                        chatId: e.object.chatId,
                        role: "assistant",
                        content: msg,
                        model: e.object.model,
                        createdAt: date,
                        error: null
                    })
                    lastUpdate = Date.now();
                }
            }
            stream.final({
                chatId: e.object.chatId,
                role: "assistant",
                content: msg,
                model: e.object.model,
                createdAt: date,
                error: null
            })
        }
    })
}