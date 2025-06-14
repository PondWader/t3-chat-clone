import { Database } from "@t3-chat-clone/db/server";
import { AuthHandler } from "./auth";
import crypto from "crypto";

export async function createLinkHandler(authHandler: AuthHandler, db: Database) {
    const tableName = db.getSafeTableName('sync');

    await db.dbConn.createTableIfNotExists(tableName, {
        id: {
            type: 'text',
            primaryKey: true
        },
        userId: {
            type: 'text'
        },
        expiresAt: {
            type: 'integer'
        },
        code: {
            type: 'text',
            unique: true
        }
    })

    return {
        async link(req: Bun.BunRequest) {
            const json = await req.json();
            const syncCode = json.code;
            if (typeof syncCode !== 'string') return Response.json({
                error: true,
                message: 'Bad request.'
            }, { status: 403 });

            const link = await db.dbConn.query(tableName, { code: syncCode }) as any | null;
            if (link === null) return Response.json({
                error: true,
                message: 'Code not found.'
            }, { status: 404 });

            const newCookies = authHandler.setGuest(link.userId);

            const headers = new Headers();
            for (const cookie of newCookies.toSetCookieHeaders()) {
                headers.set('Set-Cookie', cookie);
            }

            return new Response(null, { status: 204, headers });
        },
        async createSyncLink(req: Bun.BunRequest) {
            const authStatus = authHandler.auth(req);
            if (!authStatus.guest) {
                return Response.json({
                    error: true,
                    message: 'Only guests can use link syncing.'
                }, { status: 403 })
            }

            const syncCode = crypto.randomBytes(12).toString('hex');

            await db.dbConn.create(tableName, {
                id: crypto.randomUUID(),
                userId: authStatus.uuid,
                expiresAt: Date.now() + 1000 * 60 * 60 * 12,
                code: syncCode
            })

            return Response.json({ code: syncCode });
        }
    }
}