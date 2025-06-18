import { X, Search, Star, Eye, Globe, FileText, Zap, Brain, Share, Check, Copy } from 'lucide-preact';
import { Signal, useComputed, useSignal } from '@preact/signals';
import { Model, models } from '../../models';
import { useSettings } from '../../db';
import Spinner from '../../components/Spinner';
import { useEffect } from 'preact/hooks';


export function ShareModal(props: {
    isOpen: Signal<boolean>;
    onClose: () => void;
    chatId: string;
}) {
    const sharedPath = useSignal<string>('');
    const sharedUrl = useComputed(() => `${window.location.origin}${sharedPath.value}`);
    const copied = useSignal(false);
    const wrapperClassName = useComputed(() => `fixed inset-0 z-50 flex items-center justify-center ${props.isOpen.value ? '' : 'hidden'}`);

    useEffect(() => {
        if (props.isOpen.value) {
            fetch(`/api/share`, {
                method: 'POST',
                body: JSON.stringify({
                    chatId: props.chatId
                })
            }).then(res => {
                if (res.ok) {
                    return res.json()
                }
            })
                .then(json => {
                    if (json && typeof json.path === 'string') {
                        sharedPath.value = json.path;
                    }
                })
        }
    }, [props.isOpen.value])

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(sharedUrl.value);
            copied.value = true;
            setTimeout(() => copied.value = false, 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    };

    return (
        <div className={wrapperClassName}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={props.onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-4xl max-h-[90vh] m-4 rounded-xl shadow-2xl overflow-hidden bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700`}>
                    <h2 className={`text-xl font-semibold text-gray-900 dark:text-white`}>
                        Share Chat
                    </h2>
                    <button
                        onClick={props.onClose}
                        className={`p-2 rounded-lg transition-colors cursor-pointer
                            dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white
                            hover:bg-gray-100 text-gray-500 hover:text-gray-700
                        `}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-6 overflow-y-auto max-h-[60vh] text-center">
                    {!sharedPath.value && <Spinner />}
                    {sharedPath.value && <>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                            <Share size={32} />
                        </div>

                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                            Share Chat
                        </h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                                Share this link:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={sharedUrl.value}
                                    readOnly
                                    className="flex-1 px-4 py-3 rounded-lg border text-sm font-mono bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 cursor-text "
                                />
                                <button
                                    onClick={handleCopyUrl}
                                    className={`cursor-pointer px-4 py-3 rounded-lg border transition-all duration-200 ${copied
                                        ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                                        }`}
                                >
                                    {copied.value ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    </>}
                </div>
            </div>
        </div >
    );
};
