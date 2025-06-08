import { createDatabase } from "@t3-chat-clone/db/server";

const DEFAULT_DB_URL = 'sqlite://database.sqlite';

const dbUrl = process.env.DB_URL ?? DEFAULT_DB_URL;

const db = createDatabase({
    dbUrl,
    models: []
})

const server = Bun.serve({
    routes: {
        "/api/db": {
            GET: (req, server) => {
                if (server.upgrade(req)) {
                    return;
                }
                return new Response("WebSocket upgrade failed", { status: 500 });
            }
        }
    },
    websocket: db.bindWebSocket()
});

console.log(`Server listening on port ${server.port}, open the application now at http://localhost:${server.port}`);