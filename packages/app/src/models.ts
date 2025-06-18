import { FunctionalComponent } from "preact";
import Llama from "./icons/Llama";
import Qwen from "./icons/Qwen";
import GPT from "./icons/GPT";
import Gemini from "./icons/Gemini";
import Claude from "./icons/Claude";

export type Model = {
    id: string;
    name: string;
    version: string;
    icon: FunctionalComponent<{ height: number, width: number }>;
    isFavorite?: boolean;
    capabilities: {
        images?: boolean;
        search?: boolean;
        files?: boolean;
        speed?: boolean;
        reasoning?: boolean;
    };
    requiresOpenRouterKey?: boolean;
}

export const models: Model[] = [
    // Generally available models
    {
        id: 'llama-3.1-8b-instant',
        name: 'Llama',
        version: '3.1 8B Instant',
        icon: Llama,
        capabilities: {
            speed: true
        }
    },
    {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama',
        version: '3.3 70B Versatile',
        icon: Llama,
        capabilities: {}
    },
    {
        id: 'qwen-qwq-32b',
        name: 'Qwen',
        version: 'QwQ 32B',
        icon: Qwen,
        capabilities: {
            reasoning: true,
            speed: true
        }
    },
    // OpenRouter models
    {
        id: 'gpt-4o-mini',
        name: 'GPT',
        version: '4o-Mini',
        icon: GPT,
        capabilities: {
            reasoning: true,
            speed: true
        },
        requiresOpenRouterKey: true
    },
    {
        id: 'gpt-4o',
        name: 'GPT',
        version: '4o',
        icon: GPT,
        capabilities: {
            reasoning: true
        },
        requiresOpenRouterKey: true
    },
    {
        id: 'gpt-4.1',
        name: 'GPT',
        version: '4.1',
        icon: GPT,
        capabilities: {},
        requiresOpenRouterKey: true
    },
    {
        id: 'claude-sonnet-4',
        name: 'Claude',
        version: 'Sonnet 4',
        icon: Claude,
        capabilities: {
            reasoning: true
        },
        requiresOpenRouterKey: true
    },
    {
        id: 'claude-opus-4',
        name: 'Claude',
        version: 'Opus 4',
        icon: Claude,
        capabilities: {
            reasoning: true,
            speed: true
        },
        requiresOpenRouterKey: true
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini',
        version: '2.5 Flash',
        icon: Gemini,
        capabilities: {
            speed: true,
            reasoning: true
        },
        requiresOpenRouterKey: true
    },
    {
        id: 'google/gemini-2.5-pro',
        name: 'Gemini',
        version: '2.5 Pro',
        icon: Gemini,
        capabilities: {
            reasoning: true
        },
        requiresOpenRouterKey: true
    }
]

export const openRouterModels = {
    'gpt-4o-mini': 'openai/gpt-4o-mini',
    'gpt-4o': 'openai/gpt-4o',
    'gpt-4.1': 'openai/gpt-4.1',
    'claude-sonnet-4': 'anthropic/claude-sonnet-4',
    'claude-opus-4': 'anthropic/claude-opus-4',
    'gemini-2.5-flash': 'google/gemini-2.5-flash',
    'google/gemini-2.5-pro': 'google/gemini-2.5-pro'
}