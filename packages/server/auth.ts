import { Database } from "@t3-chat-clone/db/server";
import nJwt from "njwt";
import crypto from "crypto";

const cookieParams = {
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as Bun.CookieSameSite,
    path: '/api'
}

type AuthOutput = {
    uuid: string;
    newCookies: Bun.CookieMap;
}

export async function createAuthHandler(db: Database) {
    const tableName = db.getSafeTableName('authentication');
    const conn = db.dbConn;

    await conn.createTableIfNotExists(tableName, {
        id: {
            type: 'text',
            primaryKey: true
        },
        guest: {
            type: 'integer'
        },
        provider: {
            type: 'text',
            nullable: true
        }
    })

    const signingKey = await getSigningKey(db);

    return {
        auth(req: Bun.BunRequest): AuthOutput {
            const refreshToken = req.cookies.get('refresh-token');
            const accessToken = req.cookies.get('access-token');

            const newCookies = new Bun.CookieMap();

            let uuid: string;
            if (accessToken !== null) {
                if (accessToken.startsWith('guest_')) {
                    const jwt = accessToken.slice(6)
                    const verifiedUuid = verifyJwt(signingKey, jwt);

                    if (verifiedUuid === null) {
                        req.cookies.delete('access-token');
                        return this.auth(req);
                    }

                    uuid = verifiedUuid;
                } else {
                    // TODO: 
                    uuid = "";
                }
            } else if (refreshToken !== null) {
                // TODO: Refresh
                uuid = "";
            } else {
                uuid = createGuest(signingKey, newCookies);
            }

            return {
                uuid,
                newCookies
            }
        }
    }
}

function createGuest(signingKey: Buffer, cookies: Bun.CookieMap) {
    const uuid = Bun.randomUUIDv7();

    const refreshJwt = nJwt.create({
        sub: uuid
    }, signingKey);
    // @ts-expect-error - no time means no expiration
    refreshJwt.setExpiration();

    cookies.set('access-token', 'guest_' + refreshJwt.compact(), {
        ...cookieParams,
        maxAge: 365 * 24 * 60 * 60
    });

    return uuid;
}

function verifyJwt(signingKey: Buffer, jwt: string): string | null {
    try {
        const verified = nJwt.verify(jwt, signingKey);
        if (verified === undefined) return null;
        return (verified.body as any).sub;
    } catch {
        return null;
    }
}

async function getSigningKey(db: Database) {
    const secretsTableName = db.getSafeTableName('secrets');

    await db.dbConn.createTableIfNotExists(secretsTableName, {
        name: {
            type: 'text',
            primaryKey: true
        },
        value: {
            type: 'text'
        }
    })

    const signingKeyRecord = await db.dbConn.query(secretsTableName, {
        name: 'signing_key'
    });

    let signingKey: Buffer;
    if (signingKeyRecord === null) {
        signingKey = crypto.randomBytes(256);
        await db.dbConn.create(secretsTableName, {
            name: 'signing_key',
            value: signingKey.toString('base64')
        })
    } else {
        signingKey = Buffer.from((signingKeyRecord as any).value, 'base64');
    }

    return signingKey;
}