import { Check, Eye, EyeOff, FileWarning, Key } from 'lucide-preact';
import Layout from './_layout';
import { useDB, useSettings } from '../../db';
import { useSignal } from '@preact/signals';
import { settings } from '@t3-chat-clone/stores';
import { storeObject } from '@t3-chat-clone/db';

type Provider = {
    id: string;
    name: string;
    settingKey: keyof storeObject<typeof settings>;
    serverEnabledKey: keyof Window['config'];
};

const PROVIDERS: Provider[] = [
    {
        id: 'groq',
        name: 'Groq',
        settingKey: 'groqKey',
        serverEnabledKey: 'groqEnabled'
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        settingKey: 'openRouterKey',
        serverEnabledKey: 'openRouterEnabled'
    }
];

declare global {
    interface Window {
        config: {
            groqEnabled: boolean;
            openRouterEnabled: boolean;
        };
    }
}

export default function KeySettings() {
    const currentSettings = useSettings();
    const db = useDB();

    const saveStatus = useSignal<Record<string, 'saved' | 'saving' | 'error' | null>>({});
    const keyVisibility = useSignal<Record<string, boolean>>({});
    const newProvider = useSignal('');
    const newApiKey = useSignal('');

    const handleAddApiKey = () => {
        if (!currentSettings.value) return;

        const provider = PROVIDERS.find(p => p.id === newProvider.value);
        if (!provider) {
            console.error('Unknown provider:', newProvider.value);
            return;
        }

        saveStatus.value = { ...saveStatus.value, [provider.id]: 'saving' };

        db.push(settings, {
            ...currentSettings.value,
            [provider.settingKey]: newApiKey.value
        })
            .then(() => {
                saveStatus.value = { ...saveStatus.value, [provider.id]: 'saved' };
                // Clear the saved status after 3 seconds
                setTimeout(() => {
                    saveStatus.value = { ...saveStatus.value, [provider.id]: null };
                }, 3000);
            })
            .catch((err) => {
                console.error(err);
                saveStatus.value = { ...saveStatus.value, [provider.id]: 'error' };
            })

        newProvider.value = '';
        newApiKey.value = '';
        // Workaround for updating provider signal to empty string not setting provider selector to default value
        (document.getElementById('provider-selector')! as HTMLSelectElement).value = '';
    }

    const handleDeleteApiKey = (providerId: string) => {
        const provider = PROVIDERS.find(p => p.id === providerId);
        if (!provider || !currentSettings.value) return;

        const rollback = currentSettings.value;

        db.push(settings, {
            ...currentSettings.value,
            [provider.settingKey]: null
        })
            .catch(err => {
                console.error(`Error removing API key: ${err}`);
                // Rollback
                db.push(settings, rollback).catch(() => { })
            })
    };

    const toggleKeyVisibility = (providerId: string) => {
        keyVisibility.value = {
            ...keyVisibility.value,
            [providerId]: !keyVisibility.value[providerId]
        };
    };

    const maskApiKey = (key: string) => {
        if (key.length <= 8) return '••••••••';
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    };

    return <Layout>
        <div className="max-w-4xl">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">AI Provider API Keys</h2>
            <p className="text-sm mb-8 text-gray-600 dark:text-gray-400">
                Add your API keys from AI inference providers to enable model access.
            </p>

            {/* Add New API Key */}
            <div className="p-6 rounded-lg border mb-8 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add New API Key</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Provider</label>
                        <select
                            value={newProvider}
                            onChange={(e) => newProvider.value = (e.target as any).value}
                            id="provider-selector"
                            className="w-full px-4 py-3 rounded-lg border bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        >
                            <option value="">Select Provider</option>
                            {PROVIDERS.map(provider => {
                                const serverEnabled = window.config?.[provider.serverEnabledKey];
                                const userHasKey = currentSettings.value?.[provider.settingKey];

                                if (!serverEnabled && !userHasKey) {
                                    return <option key={provider.id} value={provider.id}>{provider.name}</option>;
                                }
                                return null;
                            })}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">API Key</label>
                        <input
                            autoComplete="off"
                            type="password"
                            value={newApiKey.value}
                            onInput={(e) => newApiKey.value = (e.target as any).value}
                            placeholder="Enter your API key"
                            className="w-full px-4 py-3 rounded-lg border bg-white border-gray-300 text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleAddApiKey}
                            disabled={!newProvider.value || !newApiKey.value}
                            className={`w-full px-6 py-3 rounded-lg font-medium ${newApiKey.value && newProvider.value
                                ? 'bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700 cursor-pointer'
                                : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Add Key
                        </button>
                    </div>
                </div>
            </div>

            {/* Existing API Keys */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Saved API Keys</h3>
                {!PROVIDERS.some(provider => currentSettings.value?.[provider.settingKey]) ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Key size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No API keys added yet</p>
                        <p className="text-sm">Add your first API key above to get started</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {PROVIDERS.map(provider => {
                            const userKey = currentSettings.value?.[provider.settingKey];
                            if (!userKey) return null;

                            return (
                                <div key={provider.id} className="flex items-center justify-between p-4 rounded-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                            <Key size={16} className="text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{provider.name}</h4>
                                            <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                                                {keyVisibility.value[provider.id] ? userKey : maskApiKey(userKey)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {saveStatus.value[provider.id] === 'saving' && (
                                            <div className="flex items-center gap-1 text-gray-600 italic text-sm">
                                                <span>Saving...</span>
                                            </div>
                                        )}
                                        {saveStatus.value[provider.id] === 'saved' && (
                                            <div className="flex items-center gap-1 text-green-500 text-sm">
                                                <Check size={14} />
                                                <span>Saved</span>
                                            </div>
                                        )}
                                        {saveStatus.value[provider.id] === 'error' && (
                                            <div className="flex items-center gap-1 text-red-500 text-sm">
                                                <FileWarning size={14} />
                                                <span>Error saving key!</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => toggleKeyVisibility(provider.id)}
                                            className="cursor-pointer p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                                        >
                                            {keyVisibility.value[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>

                                        <button
                                            onClick={() => handleDeleteApiKey(provider.id)}
                                            className="cursor-pointer px-3 py-1 rounded text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    </Layout >
};
