import { groq } from "@ai-sdk/groq";
import { storeObject } from "@t3-chat-clone/db";
import { generateText, LanguageModelV1 } from "ai";
import { chat, chatMessage, settings } from "@t3-chat-clone/stores";
import { Database } from "@t3-chat-clone/db/server";
import { CoreMessage, streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { openRouterModels, supportedGroqModels } from "./models";

const titleModel = groq('llama-3.1-8b-instant');

const BUFFER_MS = 20;

export async function handleMessage(db: Database, id: string, user: string, object: storeObject<typeof chatMessage>) {
    let model: LanguageModelV1;
    if (supportedGroqModels.includes(object.model)) {
        model = groq(object.model);
    } else {
        const byok = await loadByokModel(db, user, object.model);
        if (typeof byok.error === 'string') {
            return;
        }
        model = byok.instance;
    };

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
        model,
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

type Model = { error: string } | { error: undefined, instance: LanguageModelV1 }

async function loadByokModel(db: Database, user: string, model: string): Promise<Model> {
    const userSettings = await db.getAll(settings, user)
    if (userSettings.length < 1 || userSettings[0].object.openRouterKey === null) return { error: 'OpenRouter API key has not been configured.' };

    const orModelId = openRouterModels[model];
    if (orModelId === undefined) return { error: 'Invalid model selection.' }

    const openRouter = createOpenRouter({
        apiKey: userSettings[0].object.openRouterKey
    })

    return { error: undefined, instance: openRouter.chat(orModelId) };
}