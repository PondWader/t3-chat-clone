import { createModel } from "@t3-chat-clone/db";
import { z } from "zod/v4";

export const account = createModel({
    name: 'account',
    schema: {
        email: z.email()
    },
    singular: true,
    editable: false
});

export const chatMessage = createModel({
    name: 'chat_message',
    schema: {
        role: z.string(),
        content: z.string()
    },
    singular: false,
    editable: false
});