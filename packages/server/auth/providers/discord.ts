import { z } from "zod/v4"
import { createAuthProvider } from "../provider.js";

const scopes = 'identify email';

export const discordAuth = createAuthProvider({
    name: 'Discord',
    config: z.object({
        clientId: z.string(),
        clientSecret: z.string(),
        redirectUri: z.string()
    }),
    callbackParams: ['code'],
    getUrl: (config, state) => `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(config.clientId)}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`,
    async authenticate(handler, config, params) {
        const tokenResp = await fetch(`https://discord.com/api/v9/oauth2/token`, {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'grant_type': 'authorization_code',
                'scope': 'identify email',
                'client_id': config.clientId,
                'client_secret': config.clientSecret,
                'redirect_uri': config.redirectUri,
                code: params.code
            })
        })
        if (tokenResp.status !== 200) {
            console.error(`got non-200 status code from Discord token exchange endpoint: ${tokenResp.status}:`)
            console.log(await tokenResp.text());
            return Response.json({ error: true, message: 'Error in validating code.' }, { status: 500 })
        }
        const token = await tokenResp.json();

        for (const scope of scopes.split(' ')) {
            if (!token.scope.includes(scope)) return Response.json({ error: true, message: 'Invalid scope' }, { status: 400 })
        }

        // Getting user data
        const userResp = await fetch(`https://discord.com/api/v9/users/@me`, {
            headers: {
                'Authorization': `${token.token_type} ${token.access_token}`
            }
        })
        if (userResp.status !== 200) {
            console.error(`got non-200 status code from Discord user info endpoint: ${userResp.status}:`)
            console.log(await userResp.text());
            return Response.json({ error: true, message: 'Error getting user information.' }, { status: 500 })
        }
        const user = await userResp.json()

        return handler.createUserResponse('discord', user.id, user.email);
    }
})