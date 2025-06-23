import { createDatabase } from "@t3-chat-clone/db/server";
import { account, chat, chatMessage, settings, writerUpdate } from "@t3-chat-clone/stores";
import { subscribeToEvents } from "./events.js";
import { createAuthHandler } from "./auth/index.js";
import { createLinkHandler } from "./auth/link.js";
import { discordAuth } from "./auth/providers/discord.js";
import { createKeyHandler } from "./keys.js";

const DEFAULT_DB_URL = 'sqlite://database.sqlite';

const dbUrl = process.env.DB_URL ?? DEFAULT_DB_URL;

export const db = await createDatabase({
    dbUrl,
    stores: [
        account,
        chatMessage,
        chat,
        settings,
        writerUpdate
    ]
})
subscribeToEvents(db);

export const authHandler = await createAuthHandler(db, [discordAuth]);
export const linkHandler = await createLinkHandler(authHandler, db);
export const keyHandler = await createKeyHandler(db);
