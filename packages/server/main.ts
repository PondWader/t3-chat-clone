import app from "@t3-chat-clone/app";
import { authHandler, db, linkHandler } from "./instances";

const server = Bun.serve({
    routes: {
        "/*": app,
        "/api/*": new Response("404 Not Found", { status: 404 }),
        "/api/auth/login": authHandler.login,
        "/api/auth/url": async (req) => Response.json(await authHandler.getAuthUrls(new URL(req.url).searchParams.get('state') ?? '')),
        "/api/link": linkHandler.link,
        "/api/link/generate": linkHandler.createSyncLink,
        "/api/db/ws": {
            GET: async (req, server) => {
                const { uuid, newCookies } = await authHandler.auth(req);

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
