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
    guest: boolean;
    newCookies: Bun.CookieMap;
}

export type AuthHandler = {
    auth(req: Bun.BunRequest): AuthOutput
    setGuest(req: Bun.BunRequest, uuid: string): Bun.CookieMap
}

export async function createAuthHandler(db: Database): Promise<AuthHandler> {
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
            let guest = false;
            if (accessToken !== null) {
                if (accessToken.startsWith('guest_')) {
                    const jwt = accessToken.slice(6)
                    const verifiedUuid = verifyJwt(signingKey, jwt, true);

                    if (verifiedUuid === null) {
                        req.cookies.delete('access-token');
                        return this.auth(req);
                    }

                    uuid = verifiedUuid;
                    guest = true;
                } else {
                    // TODO: 
                    uuid = "";
                }
            } else if (refreshToken !== null) {
                // TODO: Refresh
                uuid = "";
            } else {
                uuid = createGuest(signingKey, newCookies);
                guest = true;
            }

            return {
                uuid,
                newCookies,
                guest
            }
        },
        setGuest(req: Bun.BunRequest, uuid: string) {
            const cookies = new Bun.CookieMap();
            setGuest(signingKey, cookies, uuid);
            return cookies;
        }
    }
}

function createGuest(signingKey: Buffer, cookies: Bun.CookieMap) {
    const uuid = Bun.randomUUIDv7();
    setGuest(signingKey, cookies, uuid);
    return uuid;
}

function setGuest(signingKey: Buffer, cookies: Bun.CookieMap, uuid: string) {
    const accessJwt = nJwt.create({
        sub: uuid,
        guest: true
    }, signingKey);
    // @ts-expect-error - no time means no expiration
    accessJwt.setExpiration();

    cookies.set('access-token', 'guest_' + accessJwt.compact(), {
        ...cookieParams,
        maxAge: 365 * 24 * 60 * 60
    });
}

function verifyJwt(signingKey: Buffer, jwt: string, guest: boolean): string | null {
    try {
        const verified = nJwt.verify(jwt, signingKey);
        if (verified === undefined) return null;
        if ((verified.body as any).guest !== guest) return null;
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