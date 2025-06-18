import { useState, useEffect } from 'preact/hooks';
import { Check, Eye, EyeOff, Key } from 'lucide-preact';
import Layout from './_layout';

interface ApiKey {
    id: string;
    name: string;
    provider: string;
    key: string;
    isVisible: boolean;
}

export default function KeySettings() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [newApiKey, setNewApiKey] = useState({ provider: '', key: '' });
    const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'saved' | 'saving' | null }>({});

    // Load API keys from localStorage on component mount
    useEffect(() => {
        const savedKeys = localStorage.getItem('apiKeys');
        if (savedKeys) {
            setApiKeys(JSON.parse(savedKeys));
        }
    }, []);

    // Save API keys to localStorage whenever apiKeys changes
    useEffect(() => {
        if (apiKeys.length > 0) {
            localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
        }
    }, [apiKeys]);

    const handleAddApiKey = () => {
        if (newApiKey.provider && newApiKey.key) {
            const newKey: ApiKey = {
                id: Date.now().toString(),
                name: newApiKey.provider,
                provider: newApiKey.provider,
                key: newApiKey.key,
                isVisible: false
            };
            setApiKeys([...apiKeys, newKey]);
            setNewApiKey({ provider: '', key: '' });

            // Show save status
            setSaveStatus({ [newKey.id]: 'saving' });
            setTimeout(() => {
                setSaveStatus({ [newKey.id]: 'saved' });
                setTimeout(() => setSaveStatus({ [newKey.id]: null }), 2000);
            }, 500);
        }
    };

    const handleDeleteApiKey = (id: string) => {
        setApiKeys(apiKeys.filter(key => key.id !== id));
    };

    const toggleKeyVisibility = (id: string) => {
        setApiKeys(apiKeys.map(key =>
            key.id === id ? { ...key, isVisible: !key.isVisible } : key
        ));
    };

    const maskApiKey = (key: string) => {
        if (key.length <= 8) return '••••••••';
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    };

    const providers = [
        'OpenRouter'
    ];

    return <Layout>
        <div className="max-w-4xl">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">AI Provider API Keys</h2>
            <p className="text-sm mb-8 text-gray-600 dark:text-gray-400">
                Add your API keys from various AI providers to enable model access. Keys are stored locally in your browser.
            </p>

            {/* Add New API Key */}
            <div className="p-6 rounded-lg border mb-8 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add New API Key</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Provider</label>
                        <select
                            value={newApiKey.provider}
                            onChange={(e) => setNewApiKey({ ...newApiKey, provider: (e.target as any).value })}
                            className="w-full px-4 py-3 rounded-lg border bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        >
                            <option value="">Select Provider</option>
                            {providers.map(provider => (
                                <option key={provider} value={provider}>{provider}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">API Key</label>
                        <input
                            type="password"
                            value={newApiKey.key}
                            onChange={(e) => setNewApiKey({ ...newApiKey, key: (e.target as any).value })}
                            placeholder="Enter your API key"
                            className="w-full px-4 py-3 rounded-lg border bg-white border-gray-300 text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleAddApiKey}
                            disabled={!newApiKey.provider || !newApiKey.key}
                            className={`w-full px-6 py-3 rounded-lg font-medium ${newApiKey.provider && newApiKey.key
                                ? 'bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
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
                {apiKeys.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Key size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No API keys added yet</p>
                        <p className="text-sm">Add your first API key above to get started</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {apiKeys.map((apiKey) => (
                            <div
                                key={apiKey.id}
                                className="flex items-center justify-between p-4 rounded-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                        <Key size={16} className="text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{apiKey.provider}</h4>
                                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                                            {apiKey.isVisible ? apiKey.key : maskApiKey(apiKey.key)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {saveStatus[apiKey.id] === 'saved' && (
                                        <div className="flex items-center gap-1 text-green-500 text-sm">
                                            <Check size={14} />
                                            <span>Saved</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => toggleKeyVisibility(apiKey.id)}
                                        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                                    >
                                        {apiKey.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>

                                    <button
                                        onClick={() => handleDeleteApiKey(apiKey.id)}
                                        className="px-3 py-1 rounded text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </Layout>
};
