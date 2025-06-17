import { Database } from "@t3-chat-clone/db/server";
import { chat, chatMessage } from "@t3-chat-clone/stores";
import { CoreMessage, streamText } from "ai";
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
            const history = await db.getAll(chatMessage, e.user, "chatId", e.object.chatId)
            const messages: CoreMessage[] = [];
            for (const msg of history) {
                if (msg.id === e.id) break;
                if (msg.object.error) continue;
                messages.push({ role: msg.object.role as any, content: msg.object.content });
            }
            messages.push({ role: 'user', content: e.object.content });

            const { textStream } = streamText({
                model: groq('llama-3.1-8b-instant'),
                messages
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