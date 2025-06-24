import { storeObject } from "@t3-chat-clone/db";
import { Database } from "@t3-chat-clone/db/server";
import { chat, writerUpdate } from "@t3-chat-clone/stores";
import { APICallError, CoreMessage, LanguageModelV1, streamText } from "ai";
import { getModel } from "./models";
import { generateTitle, BUFFER_MS } from "./chat";
import { keyHandler } from "./instances";

export async function handleWriterUpdate(db: Database, id: string, user: string, object: storeObject<typeof writerUpdate>) {
    if (!object.message) return;

    let isByok: boolean;
    let model: LanguageModelV1;
    try {
        const m = await getModel(object.model, db, keyHandler, user, false);
        isByok = m.isByok
        model = m.model;
    } catch (err) {
        let errorMsg = 'Something unexpected happened loading the model!';
        if (typeof err === 'string') {
            errorMsg = err;
        }
        await db.push(writerUpdate, user, {
            ...object,
            error: errorMsg
        }, undefined, id)
        return;
    }

    titleChat(db, user, object.chatId, object.message);

    const messages: CoreMessage[] = [];
    if (object.content) {
        messages.push({
            role: 'system',
            content: 'You are an AI tool for editing text. You will be provided with a piece of text written by the user, you will also receive a request from the user to edit this text or create something totally new. You must respond with the text editted as requested by the user and nothing else!'
        })
        messages.push({
            role: 'user',
            content: `Here is my editing request: ${object.message}\nHere is my text: \n${object.content}`
        })
    } else {
        messages.push({
            role: 'system',
            content: 'You are an AI tool for creating a piece of writing. The user will provide you with a request and you will fulfill it by responding with the requested writing. You will not respond with anything else!'
        })
        messages.push({ role: 'user', content: object.message });
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

    const stream = db.partial(writerUpdate, user);

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
                role: "assistant",
                content: msg,
                model: object.model,
                createdAt: date,
                error,
                message: null
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
        error,
        message: null
    })
}

async function titleChat(db: Database, user: string, chatId: string, msg: string) {
    const chats = await db.getAll(chat, user, 'chatId', chatId);
    const writerChat = chats[0];
    if (writerChat === undefined || (writerChat.object.title !== null && writerChat.object.title !== 'New Writer')) return;
    const title = await generateTitle(msg, db, user);
    await db.push(chat, user, {
        ...writerChat.object,
        title
    }, undefined, writerChat.id);
}