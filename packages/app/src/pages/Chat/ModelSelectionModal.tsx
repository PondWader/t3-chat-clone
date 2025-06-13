import { X, Search, Star, Eye, Globe, FileText, Zap, AlertTriangle } from 'lucide-preact';
import GeminiIcon from '../../icons/Gemini';
import GptIcon from '../../icons/GPT';
import { FunctionalComponent } from 'preact';


type ModelCard = {
    id: string;
    name: string;
    version: string;
    icon: FunctionalComponent;
    isFavorite?: boolean;
    capabilities: {
        vision?: boolean;
        web?: boolean;
        files?: boolean;
        speed?: boolean;
        reasoning?: boolean;
    };
    isDisabled?: boolean;
}

const favoriteModels: ModelCard[] = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini',
        version: '2.5 Flash',
        icon: GeminiIcon,
        isFavorite: true,
        capabilities: { vision: true, web: true, files: true, speed: true }
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini',
        version: '2.5 Pro',
        icon: GeminiIcon,
        capabilities: { vision: true, reasoning: true }
    },
    {
        id: 'gpt-4o',
        name: 'GPT',
        version: '4o',
        icon: GptIcon,
        capabilities: { vision: true, reasoning: true }
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT',
        version: '4o-mini',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>,
        capabilities: { speed: true }
    },
    {
        id: 'claude-4-sonnet',
        name: 'Claude',
        version: '4 Sonnet',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>,
        capabilities: { reasoning: true, files: true }
    },
    {
        id: 'claude-4-sonnet-reasoning',
        name: 'Claude',
        version: '4 Sonnet',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>,
        capabilities: { reasoning: true, files: true },
        isDisabled: true
    },
    {
        id: 'deepseek-r1',
        name: 'DeepSeek',
        version: 'R1',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">D</div>,
        capabilities: { reasoning: true },
        isDisabled: true
    }
];

const otherModels: ModelCard[] = [
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini',
        version: '2.0 Flash',
        icon: GeminiIcon,
        capabilities: { vision: true, web: true, files: true }
    },
    {
        id: 'gemini-2.0-flash-lite',
        name: 'Gemini',
        version: '2.0 Flash Lite',
        icon: GeminiIcon,
        capabilities: { speed: true, files: true }
    },
    {
        id: 'gemini-2.5-flash-thinking',
        name: 'Gemini',
        version: '2.5 Flash',
        icon: GeminiIcon,
        capabilities: { reasoning: true, web: true, files: true },
        isDisabled: true
    },
    {
        id: 'gpt-4o-mini-2',
        name: 'GPT',
        version: '4o-mini',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>,
        capabilities: { vision: true }
    },
    {
        id: 'gpt-4o-2',
        name: 'GPT',
        version: '4o',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>,
        capabilities: { vision: true }
    },
    {
        id: 'gpt-4.1',
        name: 'GPT',
        version: '4.1',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>,
        capabilities: { vision: true }
    },
    {
        id: 'gpt-4.1-mini',
        name: 'GPT',
        version: '4.1 Mini',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>,
        capabilities: { speed: true }
    },
    {
        id: 'gpt-4.1-nano',
        name: 'GPT',
        version: '4.1 Nano',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>,
        capabilities: { vision: true }
    },
    {
        id: 'o3-mini',
        name: 'o3',
        version: 'mini',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">o3</div>,
        capabilities: { reasoning: true }
    },
    {
        id: 'o3',
        name: 'o3',
        version: '',
        icon: () => <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">o3</div>,
        capabilities: { reasoning: true },
        isDisabled: true
    }
];

function ModelCard(props: {
    model: ModelCard;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={props.onClick}
            disabled={props.model.isDisabled}
            className={`relative p-4 rounded-lg border-2 text-left w-full ${props.model.isDisabled
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
                <props.model.icon />
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
                {props.model.capabilities.vision && (
                    <Eye size={14} className="text-gray-500 dark:text-gray-400" />
                )}
                {props.model.capabilities.web && (
                    <Globe size={14} className="text-gray-500 dark:text-gray-400" />
                )}
                {props.model.capabilities.files && (
                    <FileText size={14} className="text-gray-500 dark:text-gray-400" />
                )}
                {props.model.capabilities.speed && (
                    <Zap size={14} className="text-gray-500 dark:text-gray-400" />
                )}
                {props.model.capabilities.reasoning && (
                    <AlertTriangle size={14} className="text-gray-500 dark:text-gray-400" />
                )}
            </div>
        </button>
    );
};

export function ModelSelectionModal({
    isOpen,
    onClose,
    selectedModel,
    onSelectModel
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedModel: string;
    onSelectModel: (model: string) => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-4xl max-h-[90vh] m-4 rounded-xl shadow-2xl overflow-hidden bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 
                }`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700`}>
                    <h2 className={`text-xl font-semibold 'text-gray-900 dark:text-white
                        }`}>
                        Select Model
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors
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
                            placeholder="Search models..."
                            className={`w-full pl-10 pr-4 py-3 rounded-lg text-sm
                              bg-gray-50 text-gray-900 placeholder-gray-500 focus: 
                                dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus: border-gray-600
                                border focus: outline-none focus: ring-2 focus: ring-purple-500 / 20
                            `}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
                    {/* Favorites Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <h3 className={`text-sm font-medium text-gray-700 dark:text-gray-300`}>
                                Favorites
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {favoriteModels.map((model) => (
                                <ModelCard
                                    key={model.id}
                                    model={model}
                                    isSelected={selectedModel === model.id}
                                    onClick={() => onSelectModel(model.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Others Section */}
                    <div>
                        <h3 className={`text-sm font-medium mb-4 text-gray-700 dark:text-gray-300
                            }`}>
                            Others
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                            {otherModels.map((model) => (
                                <ModelCard
                                    key={model.id}
                                    model={model}
                                    isSelected={selectedModel === model.id}
                                    onClick={() => onSelectModel(model.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
