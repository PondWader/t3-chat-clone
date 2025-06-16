import { createStore } from "@t3-chat-clone/db";
import { z } from "zod/v4";

export const account = createStore({
    name: 'account',
    type: 'singular',
    schema: z.object({
        email: z.email(),
        username: z.string(),
        displayName: z.string(),
        avatarUrl: z.string().optional()
    }),
    validateClientAction(action, object) {
        return false;
    },
});

export const chat = createStore({
    name: 'chat',
    type: 'event',
    schema: z.object({
        chatId: z.string(),
        title: z.string().nullable()
    })
})

export const chatMessage = createStore({
    name: 'chat_message',
    type: 'event',
    schema: z.object({
        chatId: z.string(),
        role: z.string(),
        content: z.string(),
        createdAt: z.int()
    }),
    indices: ["chatId"],
    validateClientAction(action, obj) {
        return action !== 'push' || obj.role === "user";
    }
});