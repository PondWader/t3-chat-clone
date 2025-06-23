import { X, Search, Star, Eye, Globe, FileText, Zap, Brain } from 'lucide-preact';
import { Signal, useComputed, useSignal } from '@preact/signals';
import { Model, models } from '../../models';
import { useSettings } from '../../db';

declare global {
    interface Window {
        config: {
            groqEnabled: boolean;
            openRouterEnabled: boolean;
        };
    }
}

function ModelCard(props: {
    model: Model;
    disabled?: boolean;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={props.onClick}
            disabled={props.disabled}
            className={`relative p-4 rounded-lg border-2 text-left w-full ${props.disabled
                ? `
                  bg-gray-100/50 border-gray-200 opacity-50 cursor-not-allowed
                    dark:bg-gray-800/50 dark:border-gray-700 dark:opacity-50
                ` : props.isSelected
                    ? `bg-purple-100 border-purple-500 shadow-lg shadow-purple-500/20 dark:bg-purple-900/30 cursor-pointer`
                    : `bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer
                    dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700
                `} `}
        >
            {props.model.isFavorite && (
                <Star
                    size={12}
                    className="absolute top-2 right-2 text-yellow-500 fill-current"
                />
            )}

            <div className="flex items-center gap-3 mb-3">
                <props.model.icon height={26} width={26} />
                <div>
                    <div className={`font-semibold text-sm text-gray-900 dark:text-white`}>
                        {props.model.name}
                    </div>
                    <div className={`text-x text-gray-500 dark:text-gray-400 `}>
                        {props.model.version}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                {props.model.capabilities.images && (
                    <Eye size={14} className="text-gray-500 dark:text-gray-400" />
                )}
                {props.model.capabilities.search && (
                    <Globe size={14} className="text-gray-500 dark:text-gray-400" />
                )}
                {props.model.capabilities.files && (
                    <FileText size={14} className="text-gray-500 dark:text-gray-400" />
                )}
                {props.model.capabilities.speed && (
                    <Zap size={14} className="text-gray-500 dark:text-gray-400" />
                )}
                {props.model.capabilities.reasoning && (
                    <Brain size={14} className="text-gray-500 dark:text-gray-400" />
                )}
            </div>
        </button>
    );
};

export function ModelSelectionModal({
    isOpen,
    selectedModel,
    onClose,
    onSelectModel
}: {
    isOpen: Signal<boolean>;
    selectedModel: Signal<Model>;
    onClose: () => void;
    onSelectModel: (model: Model) => void;
}) {
    const settings = useSettings();
    const search = useSignal('');
    const wrapperClassName = useComputed(() => `fixed inset-0 z-50 flex items-center justify-center ${isOpen.value ? '' : 'hidden'}`);

    // Filter models into categories based on availability
    const filteredModels = useComputed(() => {
        const searchTerm = search.value.toLowerCase();
        const available: Model[] = [];
        const requireGroq: Model[] = [];
        const requireOpenRouter: Model[] = [];

        models.filter(m => (m.name + ' ' + m.version).toLowerCase().includes(searchTerm)).forEach(model => {
            // Check if model is available (server has key OR user has key)
            const groqAvailable = window.config?.groqEnabled || settings.value.groqKey;
            const openRouterAvailable = window.config?.openRouterEnabled || settings.value.openRouterKey;

            if (model.requiresGroqKey && groqAvailable) {
                available.push(model);
            } else if (model.requiresOpenRouterKey && openRouterAvailable) {
                available.push(model);
            } else if (model.requiresGroqKey && !groqAvailable) {
                requireGroq.push(model);
            } else if (model.requiresOpenRouterKey && !openRouterAvailable) {
                requireOpenRouter.push(model);
            } else if (!model.requiresGroqKey && !model.requiresOpenRouterKey) {
                // Models that don't require any keys (fallback case)
                available.push(model);
            }
        });

        return { available, requireGroq, requireOpenRouter };
    });

    return (
        <div className={wrapperClassName}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-4xl max-h-[90vh] m-4 rounded-xl shadow-2xl overflow-hidden bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700`}>
                    <h2 className={`text-xl font-semibold text-gray-900 dark:text-white`}>
                        Select Model
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors cursor-pointer
                            dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white
                            hover:bg-gray-100 text-gray-500 hover:text-gray-700
                        `}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 pb-4">
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400`} />
                        <input
                            type="text"
                            value={search.value}
                            onInput={e => search.value = (e.target as any).value}
                            placeholder="Search models..."
                            className={`w-full pl-10 pr-4 py-3 rounded-lg text-sm
                              bg-gray-50 text-gray-900 placeholder-gray-500 
                                dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-gray-600
                                border focus:outline-none 
                            `}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
                    {/* Available Models Section */}
                    {filteredModels.value.available.length > 0 && (
                        <ModelCategory
                            name="Available Models"
                            models={filteredModels.value.available}
                            selectedModel={selectedModel}
                            onSelectModel={onSelectModel}
                        />
                    )}

                    {/* Require Groq Key Section */}
                    {filteredModels.value.requireGroq.length > 0 && (
                        <ModelCategory
                            name="Require Groq key in Settings"
                            models={filteredModels.value.requireGroq}
                            disabled={true}
                            selectedModel={selectedModel}
                            onSelectModel={onSelectModel}
                        />
                    )}

                    {/* Require OpenRouter Key Section */}
                    {filteredModels.value.requireOpenRouter.length > 0 && (
                        <ModelCategory
                            name="Require OpenRouter Key in Settings"
                            models={filteredModels.value.requireOpenRouter}
                            disabled={true}
                            selectedModel={selectedModel}
                            onSelectModel={onSelectModel}
                        />
                    )}

                    {/* No Results */}
                    {filteredModels.value.available.length === 0 &&
                        filteredModels.value.requireGroq.length === 0 &&
                        filteredModels.value.requireOpenRouter.length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <Search size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No models found matching "{search.value}"</p>
                            </div>
                        )}
                </div>
            </div>
        </div >
    );
};

function ModelCategory(props: { name: string, disabled?: boolean, models: Model[], selectedModel: Signal<Model>, onSelectModel: (m: Model) => void }) {
    return <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
            <h3 className={`text-sm font-medium text-gray-700 dark:text-gray-300`}>
                {props.name}
            </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {props.models.map((model) => (
                <ModelCard
                    key={model.id}
                    model={model}
                    disabled={props.disabled}
                    isSelected={props.selectedModel.value === model}
                    onClick={() => props.onSelectModel(model)}
                />
            ))}
        </div>
    </div>
}