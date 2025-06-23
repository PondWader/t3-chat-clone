import { LanguageModelV1 } from "ai";
import { KeyHandler } from "./keys";
import { Database } from "@t3-chat-clone/db/server";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { settings } from "@t3-chat-clone/stores";

export type Provider = 'Groq' | 'OpenRouter';

export const groqModels = {
    'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile': 'llama-3.3-70b-versatile',
    'qwen-qwq-32b': 'qwen-qwq-32b'
}

export const openRouterModels = {
    'gpt-4o-mini': 'openai/gpt-4o-mini',
    'gpt-4o': 'openai/gpt-4o',
    'gpt-4.1': 'openai/gpt-4.1',
    'claude-sonnet-4': 'anthropic/claude-sonnet-4',
    'claude-opus-4': 'anthropic/claude-opus-4',
    'gemini-2.5-flash': 'google/gemini-2.5-flash',
    'gemini-2.5-flash-lite': 'google/gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.5-pro': 'google/gemini-2.5-pro',
    'deepseek-r1': 'deepseek/deepseek-r1'
}

type ProviderConfig = {
    name: Provider;
    models: Record<string, string>;
    settingKey: 'groqKey' | 'openRouterKey';
    createModel: (modelId: string, key: string, search?: boolean) => LanguageModelV1;
};

const PROVIDER_CONFIGS: ProviderConfig[] = [
    {
        name: 'Groq',
        models: groqModels,
        settingKey: 'groqKey',
        createModel: (modelId: string, key: string) => {
            const groq = createGroq({ apiKey: key })
            return groq(modelId);
        }
    },
    {
        name: 'OpenRouter',
        models: openRouterModels,
        settingKey: 'openRouterKey',
        createModel: (modelId: string, key: string, search = false) => {
            let orModelId = modelId;
            if (search) orModelId += ':online';
            const openRouter = createOpenRouter({ apiKey: key });
            return openRouter.chat(orModelId);
        }
    }
];

export async function getModel(modelId: string, db: Database, keyHandler: KeyHandler, user: string, search = false) {
    let model: LanguageModelV1;
    let isByok = false;

    // Find which provider contains this model
    for (const providerConfig of PROVIDER_CONFIGS) {
        const mappedModelId = providerConfig.models[modelId];
        if (mappedModelId) {
            // Check if server has a key for this provider
            if (keyHandler.hasKey(providerConfig.name)) {
                // Use server-side key
                const serverKey = keyHandler.getKey(providerConfig.name)!;
                model = providerConfig.createModel(mappedModelId, serverKey, search);
                isByok = false;
            } else {
                // Load user's BYOK key from database
                const userKey = await getUserKey(db, user, providerConfig.settingKey);
                if (!userKey) {
                    throw `${providerConfig.name} API key has not been configured in settings.`;
                }
                model = providerConfig.createModel(mappedModelId, userKey, search);
                isByok = true;
            }
            return { model, isByok };
        }
    }

    throw `Invalid model selection: ${modelId}`;
}

async function getUserKey(db: Database, user: string, settingKey: 'groqKey' | 'openRouterKey'): Promise<string | null> {
    const userSettings = await db.getAll(settings, user);
    if (userSettings.length < 1) return null;
    return userSettings[0].object[settingKey];
}