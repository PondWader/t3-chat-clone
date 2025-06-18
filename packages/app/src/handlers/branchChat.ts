import { storeObject } from "@t3-chat-clone/db";
import { Client } from "@t3-chat-clone/db/client";
import { chat, chatMessage } from "@t3-chat-clone/stores";

export async function branchChat(db: Client, chatId: string, messages: storeObject<typeof chatMessage>[]): Promise<string> {
    const chatObj = await db.getAllMatches(chat, "chatId", chatId);
    if (chatObj.length < 1) throw new Error('Could not find chat!');
    const newChatId = crypto.randomUUID();

    await Promise.all(messages.map(m => {
        return db.push(chatMessage, {
            ...m,
            chatId: newChatId,
            copied: 1
        });
    }));

    await db.push(chat, {
        chatId: newChatId,
        title: chatObj[0].object.title,
        branch: 1,
        createdAt: Date.now()
    })

    return newChatId;
}