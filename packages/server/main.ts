import { createDatabase } from "@t3-chat-clone/db/server";
import { account, chatMessage } from "../stores/index.js";
import app from "@t3-chat-clone/app";

const DEFAULT_DB_URL = 'sqlite://database.sqlite';

const dbUrl = process.env.DB_URL ?? DEFAULT_DB_URL;

const db = createDatabase({
    dbUrl,
    stores: [
        chatMessage,
        account
    ]
})

const server = Bun.serve({
    routes: {
        "/*": app,
        "/api/*": new Response("404 Not Found", { status: 404 }),
        "/api/db/ws": {
            GET: (req, server) => {
                // TODO: Do auth here and pass in data
                if (server.upgrade(req, {
                    data: {

                    }
                })) {
                    return;
                }
                return new Response("WebSocket upgrade failed", { status: 500 });
            }
        }
    },
    websocket: db.bindWebSocket(),
    development: process.env.NODE_ENV === 'development'
});


console.log(`Server listening on port ${server.port}, open the application now at http://localhost:${server.port}`);