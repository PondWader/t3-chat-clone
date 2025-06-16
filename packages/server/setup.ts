import readline from "readline";
import { discordAuth } from "./auth/providers/discord";
import { authHandler } from "./instances";

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

await authHandler.setProviderConfig(discordAuth, {
    clientId,
    clientSecret,
    redirectUri
})