import { FunctionalComponent } from "preact";
import Llama from "./icons/Llama";
import Qwen from "./icons/Qwen";

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
    }
]