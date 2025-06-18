import { groq } from "@ai-sdk/groq";
import { storeObject } from "@t3-chat-clone/db";
import { generateText } from "ai";
import { chat, chatMessage } from "@t3-chat-clone/stores";
import { Database } from "@t3-chat-clone/db/server";
import { CoreMessage, streamText } from "ai";

const SUPPORTED_GROQ_MODELS = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'qwen-qwq-32b']

const titleModel = groq('llama-3.1-8b-instant');

const BUFFER_MS = 20;

export async function handleMessage(db: Database, id: string, user: string, object: storeObject<typeof chatMessage>) {
    if (!SUPPORTED_GROQ_MODELS.includes(object.model)) return;

    const history = await db.getAll(chatMessage, user, "chatId", object.chatId)
    const messages: CoreMessage[] = [];
    for (const msg of history) {
        if (msg.id === id) break;
        if (msg.object.error) continue;
        messages.push({ role: msg.object.role as any, content: msg.object.content });
    }
    messages.push({ role: 'user', content: object.content });

    if (messages.length === 1) {
        createNewChat(db, user, object.chatId, object.content);
    }

    const { textStream } = streamText({
        model: groq(object.model),
        messages,
        onError: (err) => {
            console.error(err);
        }
    });

    const stream = db.partial(chatMessage, user);

    let msg = '';
    const date = Date.now();
    let lastUpdate = 0;
    for await (const textPart of textStream) {
        msg += textPart;
        if (Date.now() - lastUpdate > BUFFER_MS) {
            stream.update({
                chatId: object.chatId,
                role: "assistant",
                content: msg,
                model: object.model,
                createdAt: date,
                error: null
            })
            lastUpdate = Date.now();
        }
    }
    stream.final({
        chatId: object.chatId,
        role: "assistant",
        content: msg,
        model: object.model,
        createdAt: date,
        error: null
    })
}

async function createNewChat(db: Database, user: string, chatId: string, firstMessage: string) {
    const title = await generateTitle(firstMessage);
    await db.push(chat, user, {
        chatId,
        title,
        createdAt: Date.now()
    })
}

async function generateTitle(message: string) {
    // Prompt taken from https://github.com/vercel/ai-chatbot/blob/f18af236a0946c808650967bef7681182ddfd1f6/app/(chat)/actions.ts#L18 (Apache license: https://github.com/vercel/ai-chatbot/blob/f18af236a0946c808650967bef7681182ddfd1f6/LICENSE)
    const { text } = await generateText({
        model: titleModel,
        system: `
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 30 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
        prompt: message.slice(0, 256),
    });

    if (text.length > 35) return message.replaceAll('\n', ' ').slice(0, 20);
    return text;
}