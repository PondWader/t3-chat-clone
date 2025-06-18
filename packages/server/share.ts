import { Database } from "@t3-chat-clone/db/server";
import { account, chatMessage } from "@t3-chat-clone/stores";
import { AuthHandler } from "./auth";

export async function createShare(db: Database, authHandler: AuthHandler) {
    const tableName = db.getSafeTableName('shared_chats');

    await db.dbConn.createTableIfNotExists(tableName, {
        id: {
            type: 'text',
            primaryKey: true
        },
        chatId: {
            type: 'text'
        },
        user: {
            type: 'text'
        }
    })

    return {
        async getShare(req: Bun.BunRequest<`${string}/:user/:id`>) {
            if (await db.dbConn.query(tableName, {
                chatId: req.params.id,
                user: req.params.user
            }) === null) return new Response(null, { status: 404 });

            const messages = await db.getAll(chatMessage, req.params.user, 'chatId', req.params.id);
            const acc = await db.getAll(account, req.params.user);

            return Response.json({
                messages,
                avatarURL: acc[0]?.object.avatarUrl
            })
        },
        async share(req: Bun.BunRequest) {
            const authed = await authHandler.auth(req);
            const json = await req.json();

            if (typeof json.chatId !== 'string') return new Response(null, { status: 400 });

            await db.dbConn.create(tableName, {
                id: Bun.randomUUIDv7(),
                chatId: json.chatId,
                user: authed.uuid
            })

            return Response.json({
                path: `/share/${authed.uuid}/${json.chatId}`
            })
        }
    }
}