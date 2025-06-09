import { createDatabase } from "@t3-chat-clone/db/server";
import { account, chatMessage } from "../stores/index.js";
import app from "@t3-chat-clone/app";
import { createAuthHandler } from "./auth.js";

const DEFAULT_DB_URL = 'sqlite://database.sqlite';

const dbUrl = process.env.DB_URL ?? DEFAULT_DB_URL;

const db = await createDatabase({
    dbUrl,
    stores: [
        chatMessage,
        account
    ]
})

const authHandler = await createAuthHandler(db);

const server = Bun.serve({
    routes: {
        "/*": app,
        "/api/*": new Response("404 Not Found", { status: 404 }),
        "/api/db/ws": {
            GET: (req, server) => {
                const { uuid, newCookies } = authHandler.auth(req);

                const headers = new Headers();
                for (const cookie of newCookies.toSetCookieHeaders()) {
                    headers.set('Set-Cookie', cookie);
                }

                if (!server.upgrade(req, {
                    headers,
                    data: {
                        user: uuid
                    }
                })) {
                    return new Response("WebSocket upgrade failed", { status: 500, headers });
                }
            }
        }
    },
    websocket: db.bindWebSocket(),
    development: process.env.NODE_ENV === 'development'
});

console.log(`Server listening on port ${server.port}, open the application now at http://localhost:${server.port}`);

// Prevent crashing on errors from this point
process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
})
process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection:', err);
})
