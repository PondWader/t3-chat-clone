import readline from "readline";
import { createAuthHandler } from "./auth";
import { createDatabase } from "@t3-chat-clone/db/server";
import { account, chat, chatMessage } from "@t3-chat-clone/stores";
import { discordAuth } from "./auth/providers/discord";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise<string>((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
}

console.log('◉ Discord OAuth2 Config');

const clientId = await askQuestion('Please enter the client ID: ');
const clientSecret = await askQuestion('Please enter the client secret: ');
const redirectUri = await askQuestion('Please enter the redirect URL (should be <site URL>/login): ');

const DEFAULT_DB_URL = 'sqlite://database.sqlite';

const dbUrl = process.env.DB_URL ?? DEFAULT_DB_URL;

const db = await createDatabase({
    dbUrl,
    stores: [
        chatMessage,
        chat,
        account
    ]
})
const authHandler = await createAuthHandler(db, [discordAuth]);
await authHandler.setProviderConfig(discordAuth, {
    clientId,
    clientSecret,
    redirectUri
})