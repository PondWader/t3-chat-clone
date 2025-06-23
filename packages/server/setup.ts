import readline from "readline";
import { discordAuth } from "./auth/providers/discord";
import { authHandler, keyHandler } from "./instances";

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

console.log('◉ Inferece API Key Config');
console.log('Leave an option empty to require the user to bring their own key.');

const groqKey = await askQuestion('Please enter your Groq key: ');
const openRouterKey = await askQuestion('Please enter your OpenRouter key: ');

console.log('Saving configuration...');
await authHandler.setProviderConfig(discordAuth, {
    clientId,
    clientSecret,
    redirectUri
})

if (groqKey) await keyHandler.storeKey('Groq', groqKey);
else await keyHandler.removeKey('Groq');
if (openRouterKey) await keyHandler.storeKey('OpenRouter', openRouterKey);
else await keyHandler.removeKey('OpenRouter');

console.log('Saved.');

process.exit(0);