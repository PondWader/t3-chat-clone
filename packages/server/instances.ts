import { createDatabase } from "@t3-chat-clone/db/server";
import { account, chat, chatMessage } from "@t3-chat-clone/stores";
import { subscribeToEvents } from "./events.js";
import { createAuthHandler } from "./auth/index.js";
import { createLinkHandler } from "./auth/link.js";
import { discordAuth } from "./auth/providers/discord.js";

const DEFAULT_DB_URL = 'sqlite://database.sqlite';

const dbUrl = process.env.DB_URL ?? DEFAULT_DB_URL;

export const db = await createDatabase({
    dbUrl,
    stores: [
        chatMessage,
        chat,
        account
    ]
})
subscribeToEvents(db);

export const authHandler = await createAuthHandler(db, [discordAuth]);
export const linkHandler = await createLinkHandler(authHandler, db);
