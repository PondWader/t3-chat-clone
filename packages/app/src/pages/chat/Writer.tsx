import { useRoute } from "preact-iso";
import Sidebar from "./Sidebar";
import { useDB, useWriterUpdates } from "../../db";
import { computed, effect, signal, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { AlertCircle, Check, Send } from "lucide-preact";
import { models } from "../../models";
import { ModelSelectionModal } from "./ModelSelectionModal";
import { useEffect, useMemo, useRef } from "preact/hooks";
import { writerUpdate } from "@t3-chat-clone/stores";
import Spinner from "../../components/Spinner";
import Timeline from "../../components/Timeline";
import { ObjectInstance, storeObject } from "@t3-chat-clone/db";
import { Client } from "@t3-chat-clone/db/client";
import ViewSwitch from "../../components/ViewSwitch";
import { SyncTimeoutError } from "../../../../db/client/Connection";

const SAVE_BUFFER_MS = 600;

export default function Writer() {
    const route = useRoute();

    return <div className={`overflow-y-hidden flex h-dvh font-sans bg-gray-50 dark:bg-gray-900`}>
        <Sidebar />
        <WriterInterface chatId={route.params.id} />
    </div>
}

function WriterInterface(props: { chatId: string }) {
    const db = useDB();
    const isLoading = useMemo(() => signal(false), [props.chatId]);
    const updates = useWriterUpdates(props.chatId);
    const text = useMemo(() => signal(''), [props.chatId]);
    const isSaved = useMemo(() => signal(true), [props.chatId]);
    const saveTimeout = useRef<number>();
    const lastEdit = useRef(0);
    const viewSelection = useSignal<'text' | 'history'>('text');

    useEffect(() => {
        effect(() => {
            if (updates.value.length > 0) {
                const latest = updates.value[0].object;
                if (latest.role !== "user" || latest.createdAt > lastEdit.current) {
                    text.value = latest.content;
                }
            } else {
                text.value = "";
            }
        });

        effect(() => {
            // Track every text change
            text.value;
            if (!isSaved.value) {
                if (saveTimeout.current !== undefined) clearTimeout(saveTimeout.current);

                saveTimeout.current = setTimeout(() => {
                    const txt = text.value;
                    const createdAt = Date.now();

                    db.push(writerUpdate, {
                        chatId: props.chatId,
                        role: 'user',
                        content: txt,
                        error: null,
                        model: "",
                        message: null,
                        createdAt
                    }).then(() => {
                        if (txt == text.value) {
                            isSaved.value = true;
                        }
                        cleanHistory(db, createdAt, updates.value).catch(() => { });
                    })
                }, SAVE_BUFFER_MS) as any as number;
            }
        });

        const sub = db.subscribe(writerUpdate, e => {
            if (e.action === 'push' && e.object.role === "assistant") {
                isLoading.value = false;
                isSaved.value = true;
            }
        });

        return () => sub.unsubscribe();
    }, [props.chatId])

    const error = useMemo(() => {
        return computed(() => {
            if (updates.value.length === 0) return null;
            const lastUpdate = updates.value[0].object;
            if (lastUpdate.role === "user" || !lastUpdate.error) return null;
            if (Date.now() - lastUpdate.createdAt > 20_000) return null;
            return lastUpdate.error;
        });
    }, [props.chatId]);

    return <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-800`}>
        <div class="flex-1 flex-row flex items-center justify-center p-1 lg:p-2">
            <div className="w-[90vw] lg:max-[1360px]:w-[min(90rem,75vw)] min-[1360px]:w-[min(90rem,60vw)] mx-auto px-1 sm:px-6 lg:px-4 py-6">
                <div className={`dark:bg-slate-900 bg-white rounded-xl shadow-lg ${viewSelection.value === 'history' ? 'max-[1360px]:hidden' : ''}`}>
                    <div className="p-6">
                        <textarea
                            value={text.value}
                            readOnly={isLoading.value}
                            onInput={(e) => {
                                isSaved.value = false;
                                lastEdit.current = Date.now();
                                text.value = (e.target as any).value;
                            }}
                            placeholder="Start typing your document..."
                            className={`w-full h-[55dvh] md:h-[min(600px,60dvh)] resize-none border-none outline-none dark:bg-slate-900 dark:text-white dark:placeholder-gray-400 bg-white text-gray-900 placeholder-gray-500 text-base leading-relaxed`}
                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
                        />
                    </div>
                </div>
                <div class={`w-full h-[calc(55dvh+1.7rem)] mt-6 md:h-[calc(min(600px,60dvh)+1.7rem)] overflow-y-hidden ${viewSelection.value === 'text' ? 'hidden' : 'min-[1360px]:hidden'}`}>
                    <UpdateTimeline updates={updates.value} isLoading={isLoading.value} text={text} />
                </div>

                <div class="flex justify-end mt-2">
                    <div class="mr-4 min-[1360px]:hidden">
                        <ViewSwitch left="text" right="History" activeView={viewSelection.value === 'text' ? "left" : "right"} onViewChange={(side) => {
                            viewSelection.value = side === 'left' ? 'text' : 'history';
                        }} />
                    </div>
                    {isSaved.value ? <p class="text-green-600"><Check class="inline" size={18} /> Saved</p>
                        : <p class="italic text-gray-400">Saving...</p>}
                </div>
            </div>

            <div class="max-[1360px]:hidden min-[2450px]:mr-20">
                <UpdateTimeline updates={updates.value} isLoading={isLoading.value} text={text} />
            </div>
        </div>


        <Input chatId={props.chatId} isLoading={isLoading} text={text} error={error} />
    </div>
}

function UpdateTimeline(props: {
    updates: ObjectInstance<storeObject<typeof writerUpdate>>[],
    isLoading: boolean,
    text: Signal<string>
}) {
    const filtered = props.updates.filter(u => u.object.role === "user" && u.object.message);
    const prevText = useRef<string>();
    const selectedUpdate = useSignal<string>();

    return <Timeline events={filtered.map((u, i) => (
        {
            key: u.id,
            content: props.isLoading && i === 0 ? (<div class="flex flex-row">
                <Spinner />
                <span class="ml-2">{u.object.message}</span>
            </div>) : u.object.message,
            icon: models.find(m => m.id === u.object.model)!.icon,
            date: new Date(u.object.createdAt),
            selected: selectedUpdate.value === u.id,
            error: u.object.error,
            onClick: () => {
                if (selectedUpdate.value === u.id) {
                    selectedUpdate.value = undefined;
                    props.text.value = prevText.current!;
                    return;
                }

                // @ts-ignore - doesn't seem to have types for findLast
                const nextUpdate = props.updates.findLast(v => v.object.createdAt > u.object.createdAt && v.object.role === "assistant");
                if (!nextUpdate) return;
                prevText.current = props.text.value;
                props.text.value = nextUpdate.object.content;
                selectedUpdate.value = u.id;

                // Upon the next text update, remove the selection of the event
                const dispose = effect(() => {
                    if (props.text.value !== nextUpdate.object.content && selectedUpdate.value === u.id) {
                        dispose();
                        selectedUpdate.value = undefined;
                    }
                });
            }
        }
    ))} />
}

function Input(props: { chatId: string, isLoading: Signal<boolean>, text: Signal<string>, error: Signal<string | null> }) {
    const message = useSignal('');
    const isModelModalOpen = useSignal(false);
    const selectedModel = useSignal(models.find(m => m.id === localStorage.getItem('selected_model_id')) ?? models.find(m => m.id === 'llama-3.1-8b-instant')!);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const db = useDB();

    useSignalEffect(() => {
        localStorage.setItem('selected_model_id', selectedModel.value.id);
    })

    const sendMessage = () => {
        const pushResult = db.push(writerUpdate, {
            chatId: props.chatId,
            role: 'user',
            content: props.text.value,
            error: null,
            model: selectedModel.value.id,
            message: message.value,
            createdAt: Date.now()
        })
        pushResult.catch(err => {
            props.isLoading.value = false;
            if (err === SyncTimeoutError) {
                db.editMemory(writerUpdate, pushResult.id, {
                    error: 'Sync timed out.'
                })
            } else {
                console.error(err);
                db.editMemory(writerUpdate, pushResult.id, {
                    error: 'An unexpected error occured.'
                })
            }
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
            {props.error.value && <div className={`flex items-center gap-3 px-4 py-3 mb-4 rounded-lg
                        bg-red-50 border border-red-200 text-red-700 
                        dark:bg-red-900/20 dark:border dark:border-red-800/30 dark:text-red-400
                    `}>
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="text-sm">{props.error.value}</span>
            </div>}

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

/**
 * Cleans update history by removing unnecessary updates
 * @param before 
 * @param updates 
 */
async function cleanHistory(db: Client, before: number, updates: ObjectInstance<storeObject<typeof writerUpdate>>[]) {
    await Promise.all(
        updates
            .filter(u => u.object.createdAt < before && !u.object.message && u.object.role === "user")
            .map(u => db.remove(writerUpdate, u.id))
    )
}