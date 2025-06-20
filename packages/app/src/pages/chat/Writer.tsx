import { useRoute } from "preact-iso";
import Sidebar from "./Sidebar";
import { useDB } from "../../db";
import { Signal, useSignal, useSignalEffect } from "@preact/signals";
import { Send } from "lucide-preact";
import { models } from "../../models";
import { ModelSelectionModal } from "./ModelSelectionModal";
import { useEffect, useRef } from "preact/hooks";
import { writerUpdate } from "@t3-chat-clone/stores";
import Spinner from "../../components/Spinner";

export default function Writer() {
    const route = useRoute();

    return <div className={`overflow-y-hidden flex h-dvh font-sans bg-gray-50 dark:bg-gray-900`}>
        <Sidebar />
        <WriterInterface chatId={route.params.id} />
    </div>
}

function WriterInterface(props: { chatId: string }) {
    const db = useDB();
    const text = useSignal('');
    const isLoading = useSignal(false);

    useEffect(() => {
        db.getAllMatches(writerUpdate, 'chatId', props.chatId)
            .then(objects => {
                if (objects.length === 0) return;
                let latestUpdate = objects[0];
                for (const obj of objects) {
                    if (obj.object.createdAt > latestUpdate.object.createdAt) {
                        latestUpdate = obj;
                    }
                }
                text.value = latestUpdate.object.content;
            })

        const sub = db.subscribe(writerUpdate, e => {
            if (e.action === 'push' && e.object.role === "assistant") {
                isLoading.value = false;
            }
            if ((e.action === 'push' || e.action === 'partial') && e.object.role === "assistant") {
                text.value = e.object.content;
            }
        });

        return () => sub.unsubscribe();
    }, [props.chatId]);

    return <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-800`}>
        <div class="flex-1 flex items-center justify-center p-1 lg:p-4">
            <div className="w-[90vw] lg:w-[min(90rem,75vw)] mx-auto px-1 sm:px-6 lg:px-8 py-6">
                <div className={`dark:bg-slate-900 bg-white rounded-xl shadow-lg`}>
                    <div className="p-6">
                        <textarea
                            value={text.value}
                            readOnly={isLoading.value}
                            onChange={e => {
                                text.value = (e.target as any).value;
                            }}
                            placeholder="Start typing your document..."
                            className={`w-full h-96 md:h-[600px] resize-none border-none outline-none dark:bg-slate-900 dark:text-white dark:placeholder-gray-400 bg-white text-gray-900 placeholder-gray-500 text-base leading-relaxed`}
                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
                        />
                    </div>
                </div>
            </div>
        </div>

        <Input chatId={props.chatId} isLoading={isLoading} text={text} />
    </div >

}

function Input(props: { chatId: string, isLoading: Signal<boolean>, text: Signal<string> }) {
    const message = useSignal('');
    const isModelModalOpen = useSignal(false);
    const selectedModel = useSignal(models.find(m => m.id === localStorage.getItem('selected_model_id')) ?? models.find(m => m.id === 'llama-3.1-8b-instant')!);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const db = useDB();

    useSignalEffect(() => {
        localStorage.setItem('selected_model_id', selectedModel.value.id);
    })

    const sendMessage = () => {
        // TODO: Handle errors
        db.push(writerUpdate, {
            chatId: props.chatId,
            role: 'user',
            content: props.text.value,
            error: null,
            model: selectedModel.value.id,
            message: message.value,
            createdAt: Date.now()
        })
        message.value = '';
        props.isLoading.value = true;
    }


    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleMessageChange = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Reset height to auto to get the correct scrollHeight
            textarea.style.height = 'auto';

            // Calculate the number of lines
            const lineHeight = 24; // Approximate line height in pixels
            const minHeight = 50; // Minimum height (1 line)
            const maxHeight = lineHeight * 10 + 20; // 10 lines + padding

            // Set height based on scroll height, but cap at max height
            const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
            textarea.style.height = `${newHeight}px`;

            // Only show scrollbar when content exceeds max height
            if (textarea.scrollHeight > maxHeight) {
                textarea.style.overflowY = 'auto';
            } else {
                textarea.style.overflowY = 'hidden';
            }
        }
    };

    return <div className={`border-t p-6 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900`}>
        <div className="max-w-4xl mx-auto">
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onInput={(e) => {
                        message.value = (e.target! as HTMLTextAreaElement).value;
                        handleMessageChange();
                    }}
                    onKeyPress={handleKeyPress}
                    onKeyDown={e => {
                        if (e.key === 'Tab') {
                            console.log('tab')
                            e.preventDefault();
                            message.value += '    ';
                        }
                    }}
                    placeholder="Ask AI to edit your writing or write something new..."
                    rows={1}
                    className={`w-full px-4 py-3 pr-12 rounded-lg resize-none min-h-[44px] leading-[24px] overflow-y-hidden
								bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400
								dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-gray-500 
								border focus:outline-none focus:ring-1 focus:ring-blue-500/20`}
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={!message.value.trim()}
                    className={`absolute right-2 top-2 p-2 rounded-md ${message.value.trim()
                        ? `text-purple-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700`
                        : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        }`}
                >
                    {props.isLoading.value ? <Spinner small={true} /> : <Send size={18} />}
                </button>
            </div>

            {/* Footer Info */}
            <div className={`flex items-center justify-between mt-4 text-xs`}>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => isModelModalOpen.value = true}
                        className={`flex items-center p-2 rounded-full gap-1 cursor-pointer
									bg-gradient-to-r from-purple-200 to-purple-50  bg-white hover:from-purple-300 hover:to-purple-100 text-gray-700 hover:text-gray-900 shadow-sm border border-purple-400
									dark:bg-gradient-to-r dark:from-purple-900 dark:to-purple-600 dark:border-purple-800 dark:border-2 dark:hover:from-purple-800 dark:hover:to-purple-500 dark:text-gray-300 dark:hover:text-white
								`}
                    >
                        <selectedModel.value.icon height={16} width={16} />
                        <span className="ml-sm">{selectedModel.value.name + ' ' + selectedModel.value.version}</span>
                    </button>
                </div>
            </div>
        </div>

        <ModelSelectionModal isOpen={isModelModalOpen} selectedModel={selectedModel} onClose={() => isModelModalOpen.value = false} onSelectModel={(model) => {
            selectedModel.value = model;
            isModelModalOpen.value = false;
        }} />
    </div>
}