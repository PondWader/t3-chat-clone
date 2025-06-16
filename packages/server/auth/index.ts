import { Database } from "@t3-chat-clone/db/server";
import nJwt from "njwt";
import crypto from "crypto";
import { DatabaseDriverConn } from "../../db/server/database";
import { AuthProvider } from "./provider";
import { account } from "@t3-chat-clone/stores";

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
    auth(req: Bun.BunRequest): Promise<AuthOutput>
    setGuest(uuid: string): Bun.CookieMap
    createUserResponse(provider: string, id: string, email: string, username: string, displayName: string, avatarUrl?: string): Promise<Response>
    setProviderConfig<T>(provider: AuthProvider<T, any>, config: T): Promise<void>
    login(req: Bun.BunRequest): Promise<any>
    getAuthUrls(state: string): Promise<Record<string, string>>
}

type UserRecord = {
    id: string;
    provider: string;
    providerUserId: string;
    email: string;
}

export async function createAuthHandler(db: Database, providers: AuthProvider<any, any>[]): Promise<AuthHandler> {
    const conn = db.dbConn;

    const tableName = db.getSafeTableName('authentication');
    await conn.createTableIfNotExists(tableName, {
        id: {
            type: 'text',
            primaryKey: true
        },
        provider: {
            type: 'text'
        },
        providerUserId: {
            type: 'text'
        },
        email: {
            type: 'text'
        }
    })

    const refreshTokensTableName = db.getSafeTableName('user_refresh_tokens');
    await conn.createTableIfNotExists(refreshTokensTableName, {
        token: {
            type: 'text',
            primaryKey: true
        },
        userId: {
            type: 'text'
        },
        createdAt: {
            type: 'integer'
        }
    });

    const providerConfigTableName = db.getSafeTableName('auth_providers');
    await conn.createTableIfNotExists(providerConfigTableName, {
        provider: {
            type: 'text',
            primaryKey: true
        },
        config: {
            type: 'text'
        }
    })

    const signingKey = await getSigningKey(db);

    return {
        async auth(req: Bun.BunRequest): Promise<AuthOutput> {
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
                    const verifiedUuid = verifyJwt(signingKey, accessToken, false);
                    if (verifiedUuid === null) {
                        req.cookies.delete('access-token');
                        return this.auth(req);
                    }
                    uuid = verifiedUuid;
                }
            } else if (refreshToken !== null && refreshToken !== '') {
                const user = await conn.query(refreshTokensTableName, { token: refreshToken }) as any | null;
                if (user === null) {
                    uuid = createGuest(signingKey, newCookies);
                    guest = true;
                    newCookies.set('refresh-token', '', { ...cookieParams, expires: new Date() });
                } else {
                    uuid = user.userId;
                }
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
        setGuest(uuid: string) {
            const cookies = new Bun.CookieMap();
            setGuest(signingKey, cookies, uuid);
            return cookies;
        },
        async createUserResponse(provider: string, providerUserId: string, email: string, username: string, displayName: string, avatarUrl?: string) {
            let userId: string | null = null;;
            await db.dbConn.transaction(async () => {
                const user = await db.dbConn.query(tableName, { provider, providerUserId }) as UserRecord | null;
                if (user === null) {
                    userId = Bun.randomUUIDv7();
                    await db.dbConn.create(tableName, {
                        id: userId,
                        provider,
                        providerUserId,
                        email
                    });
                } else {
                    userId = user.id;
                    if (user.email !== email) {
                        await db.dbConn.update(tableName, { id: userId }, { email });
                    }
                }
            });
            if (userId === null) throw new Error("Something went wrong loading user ID after authentication.");

            await db.push(account, userId, {
                email,
                username,
                displayName,
                avatarUrl: avatarUrl ?? null
            })

            const newCookies = new Bun.CookieMap();
            createUserToken(signingKey, newCookies, conn, refreshTokensTableName, userId);

            const headers = new Headers();
            for (const cookie of newCookies.toSetCookieHeaders()) {
                headers.set('Set-Cookie', cookie);
            }

            return new Response(null, { status: 204, headers });
        },
        async setProviderConfig<T>(provider: AuthProvider<T, any>, config: T): Promise<void> {
            config = provider.config.parse(config) as T;

            await conn.transaction(async () => {
                const existing = await conn.query(providerConfigTableName, { provider: provider.name });
                if (existing === null) {
                    await conn.create(providerConfigTableName, {
                        provider: provider.name,
                        config: JSON.stringify(config)
                    })
                } else {
                    await conn.update(providerConfigTableName, {
                        provider: provider.name
                    }, {
                        config: JSON.stringify(config)
                    })
                }
            });
        },
        async login(req: Bun.BunRequest) {
            const json = await req.json();
            const provider = providers.find(p => p.name === json.provider);
            if (provider === undefined) return new Response('Provider does not exis', { status: 400 });

            const params = json.params;
            for (const param of provider.callbackParams) {
                if (typeof params[param] !== 'string') return new Response('Missing auth parameter', { status: 400 });;
            }

            const providerConfig = await conn.query(providerConfigTableName, { provider: provider.name });
            if (providerConfig === null) return new Response('Auth provider has not been configured', { status: 400 });

            return provider.authenticate(this, JSON.parse((providerConfig as any).config), params);
        },
        async getAuthUrls(state: string): Promise<Record<string, string>> {
            const urls: Record<string, string> = {};
            for (const provider of providers) {
                const result = await conn.query(providerConfigTableName, { provider: provider.name }) as any | null;
                if (result === null) continue;
                urls[provider.name.toLowerCase()] = provider.getUrl(JSON.parse(result.config), state);
            }
            return urls;
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

async function createUserToken(signingKey: Buffer, cookies: Bun.CookieMap, dbConn: DatabaseDriverConn, refreshTokenTableName: string, uuid: string) {
    const accessJwt = nJwt.create({
        sub: uuid,
        guest: false
    }, signingKey);
    accessJwt.setExpiration(Date.now() + 1000 * 60 * 15);

    const refreshToken = crypto.randomBytes(48).toString('base64url');

    await dbConn.create(refreshTokenTableName, {
        token: refreshToken,
        userId: uuid,
        createdAt: Date.now()
    });

    cookies.set('access-token', accessJwt.compact(), {
        ...cookieParams,
        maxAge: 60 * 15
    });
    cookies.set('refresh-token', refreshToken, {
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