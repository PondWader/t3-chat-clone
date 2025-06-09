import { createStore } from "@t3-chat-clone/db";
import { z } from "zod/v4";

export const account = createStore({
    name: 'account',
    type: 'singular',
    schema: z.object({
        email: z.email()
    })
});

export const chatMessage = createStore({
    name: 'chat_message',
    type: 'event',
    schema: z.object({
        chatId: z.string(),
        role: z.string(),
        content: z.string(),
    }),
    indices: ["chatId"],
    validateUpdate(action, obj) {
        return action !== 'push' || obj.role === "user";
    }
});