import { storeObject } from "@t3-chat-clone/db";
import { APICallError, generateText, ImagePart, LanguageModelV1 } from "ai";
import { chat, chatMessage } from "@t3-chat-clone/stores";
import { Database } from "@t3-chat-clone/db/server";
import { CoreMessage, streamText } from "ai";
import { getModel as getModelFromModels } from "./models";
import { keyHandler } from "./instances";

const TITLE_MODEL = process.env.TITLE_MODEL || 'llama-3.1-8b-instant';

export const BUFFER_MS = 20;

export async function handleMessage(db: Database, id: string, user: string, object: storeObject<typeof chatMessage>) {
    let isByok: boolean;
    let model: LanguageModelV1;
    try {
        const m = await getModelFromModels(object.model, db, keyHandler, user, object.search > 0);
        isByok = m.isByok
        model = m.model;
    } catch (err) {
        let errorMsg = 'Something unexpected happened loading the model!';
        if (typeof err === 'string') {
            errorMsg = err;
        }
        await db.push(chatMessage, user, {
            ...object,
            error: errorMsg
        }, undefined, id)
        return;
    }

    const history = await db.getAll(chatMessage, user, "chatId", object.chatId)
    const messages: CoreMessage[] = [];
    for (const msg of history) {
        if (msg.id === id) break;
        if (msg.object.error) continue;
        messages.push(objectToMessage(msg.object, false));
    }
    messages.push(objectToMessage(object, true));

    if (messages.length === 1) {
        createNewChat(db, user, object.chatId, object.content);
    }

    if (object.short) {
        messages.push({ role: 'system', content: 'The user has requested you answer the last message briefly using as few words as possible.' },)
    }

    let error: string | null = null;
    const { textStream } = streamText({
        model,
        messages,
        onError: (err) => {
            if (err.error instanceof APICallError && isByok) {
                try {
                    if (err.error.responseBody) {
                        const json = JSON.parse(err.error.responseBody!);
                        if (json.error.message && json.error.message !== 'No auth credentials found') {
                            error = 'OpenRouter error: ' + json.error.message;
                            return;
                        }
                    }
                } catch { }
                error = 'OpenRouter API key is invalid.';
                return;
            }
            error = 'An unexpected error occured. Try again.'
            console.error(err);
        }
    });

    const stream = db.partial(chatMessage, user);

    let msg = '';
    // Ensure messages are never out of order
    let date = Date.now();
    if (date < object.createdAt) {
        date = object.createdAt + 1;
    }

    let lastUpdate = 0;
    for await (const textPart of textStream) {
        msg += textPart;
        if (Date.now() - lastUpdate > BUFFER_MS) {
            stream.update({
                chatId: object.chatId,
                copied: 0,
                role: "assistant",
                content: msg,
                model: object.model,
                search: object.search,
                short: object.short,
                attachments: null,
                createdAt: date,
                error
            })
            lastUpdate = Date.now();
        }
    }
    stream.final({
        chatId: object.chatId,
        copied: 0,
        role: "assistant",
        content: msg,
        model: object.model,
        search: object.search,
        short: object.short,
        attachments: null,
        createdAt: date,
        error
    })
}

async function createNewChat(db: Database, user: string, chatId: string, firstMessage: string) {
    const createdAt = Date.now();
    const id = await db.push(chat, user, {
        chatId,
        title: 'New Chat',
        branch: 0,
        writer: 0,
        createdAt
    })
    const title = await generateTitle(firstMessage, db, user);
    await db.push(chat, user, {
        chatId,
        title,
        branch: 0,
        writer: 0,
        createdAt: Date.now()
    }, undefined, id)
}

export async function generateTitle(message: string, db: Database, user: string) {
    // Prompt taken from https://github.com/vercel/ai-chatbot/blob/f18af236a0946c808650967bef7681182ddfd1f6/app/(chat)/actions.ts#L18 (Apache license: https://github.com/vercel/ai-chatbot/blob/f18af236a0946c808650967bef7681182ddfd1f6/LICENSE)
    try {
        const { model } = await getModelFromModels(TITLE_MODEL, db, keyHandler, user, false);

        const { text } = await generateText({
            model,
            system: `
        - you will generate a short title based on the first message a user begins a conversation with
        - ensure it is not more than 30 characters long
        - the title should be a summary of the user's message
        - do not use quotes or colons`,
            prompt: message.slice(0, 256),
        });

        if (text.length > 35) return text.replaceAll('\n', ' ').slice(0, 35);
        return text;
    } catch (error) {
        // Fallback to simple title if model fails
        console.warn('Title generation failed:', error);
        return message.replaceAll('\n', ' ').slice(0, 20);
    }
}

function objectToMessage(msg: storeObject<typeof chatMessage>, allowImage: boolean): CoreMessage {
    if (!msg.attachments || !allowImage) {
        return { role: msg.role as any, content: msg.content }
    }
    try {
        const attachments = JSON.parse(msg.attachments);
        if (!Array.isArray(attachments) || attachments.length > 3) return { role: msg.role as any, content: msg.content }

        return {
            role: msg.role as any,
            content: [
                { type: 'text', text: msg.content },
                ...attachments.map(v => ({
                    type: 'image',
                    mimeType: v.endsWith('.jpeg') ? 'image/jpeg' : 'image/png',
                    image: new URL(v)
                } as ImagePart))
            ]
        }
    } catch (err) {
        console.error(err);
        return { role: msg.role as any, content: msg.content }
    }
}