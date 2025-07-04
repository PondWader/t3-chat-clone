import { AlertCircle, Check, CircleX, Copy, Edit, GitBranch, RefreshCcw, X } from "lucide-preact";
import { ObjectInstance, storeObject } from "@t3-chat-clone/db";
import { account, chatMessage } from "@t3-chat-clone/stores";
import { Signal, useSignal } from "@preact/signals";
import { useAccount, useDB } from "../../db";
import Avatar from "../../icons/Avatar";
import Markdown from "../../components/Markdown";
import { models } from "../../models";
import { FunctionalComponent } from "preact";
import { branchChat } from "../../handlers/branchChat";
import { useLocation } from "preact-iso";
import Spinner from "../../components/Spinner";

export default function Messages(props: { messages: Signal<ObjectInstance<storeObject<typeof chatMessage>>[]>, sendMessage: (msg: string, attachments: string[], settings: any) => void, message: Signal<string>, avatarUrl: Signal<string | undefined>, readOnly: boolean }) {
    const db = useDB();

    const lastMsg = props.messages.value[props.messages.value.length - 1];
    const isLoading = lastMsg.object.role === "user" && !lastMsg.object.error;
    const LoadingModelIcon = getModelIcon(lastMsg.object.model);

    const branch = async (msg: storeObject<typeof chatMessage>) => {
        const msgs = props.messages.value.slice(0, props.messages.value.findIndex(m => m.object === msg) + 1);
        try {
            return await branchChat(db, msg.chatId, msgs.map(v => v.object));
        } catch (err) {
            return null;
        }
    }

    return <div className="flex-1 overflow-y-auto p-6 flex-col-reverse" id="messages-display">
        <div className="max-w-[90vw] lg:max-w-[min(56rem,70vw)] mx-auto space-y-6 mb-[300px]">
            {props.messages.value.map((msg, i) => (
                <Message branch={branch} avatarUrl={props.avatarUrl} msg={msg.object} id={msg.id} isLastMsg={i + 1 === props.messages.value.length} sendMessage={props.sendMessage} message={props.message} readOnly={props.readOnly} />
            ))}

            {/* Loading Message */}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                        {/* AI Avatar */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                            <LoadingModelIcon width={16} height={16} />
                        </div>

                        {/* Loading Bubble */}
                        <div className="rounded-2xl px-4 py-3 bg-white border border-gray-200 dark:bg-gray-700 dark:border-transparent">
                            <div className="flex items-center gap-1">
                                <div
                                    className="w-2 h-2 rounded-full animate-pulse bg-gray-500 dark:bg-gray-400"
                                    style={{ animationDelay: '0ms' }}
                                ></div>
                                <div
                                    className="w-2 h-2 rounded-full animate-pulse bg-gray-500 dark:bg-gray-400"
                                    style={{ animationDelay: '150ms' }}
                                ></div>
                                <div
                                    className="w-2 h-2 rounded-full animate-pulse bg-gray-500 dark:bg-gray-400"
                                    style={{ animationDelay: '300ms' }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
}

function Message(props: { avatarUrl: Signal<string | undefined>, msg: storeObject<typeof chatMessage>, id: string, isLastMsg: boolean, sendMessage: (msg: string, attachments: string[], settings: any) => void, branch: (msg: storeObject<typeof chatMessage>) => Promise<string | null>, message: Signal<string>, readOnly: boolean }) {
    const db = useDB();
    const location = useLocation();

    const isUserMsg = props.msg.role === 'user';
    const ModelIcon = getModelIcon(props.msg.model);
    const copied = useSignal(false);
    const branchStatus = useSignal<"loading" | "failed">();

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(props.msg.content);
            copied.value = true;
            setTimeout(() => copied.value = false, 1500);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
        }
    }

    const resend = () => {
        props.sendMessage(props.msg.content, JSON.parse(props.msg.attachments!) || [], {
            search: props.msg.search > 0,
            shortResponse: props.msg.short > 0
        });
    }

    const branch = async () => {
        branchStatus.value = "loading";
        const branchId = await props.branch(props.msg);
        console.log(branchId)
        if (branchId) {
            location.route(`/chat/${branchId}`);
            branchStatus.value = undefined;
        } else {
            branchStatus.value = "failed";
            setTimeout(() => branchStatus.value = undefined, 1500)
        }
    }

    return <>
        {(props.msg.content || !props.msg.error) && <div
            key={props.id}
            className={`flex ${isUserMsg ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`flex gap-3 max-w-[90%] lg:max-w-[80%] ${isUserMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 dark:bg-gray-700`}>
                    {isUserMsg ? (
                        props.avatarUrl.value ? <img alt="user avatar" class="rounded-full" width="40" height="40" src={props.avatarUrl.value ?? ''} /> : <Avatar />
                    ) : (
                        <ModelIcon height={16} width={16} />
                    )}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 min-w-0 bg-white text-gray-900 border border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-transparent`}>
                    <div className="text-sm leading-relaxeds overflow-hidden break-words overflow-wrap-anywhere">
                        <Markdown>{props.msg.content}</Markdown>
                    </div>

                    {props.msg.attachments && JSON.parse(props.msg.attachments).map((a: string) => {
                        return <img class="mr-2" width="120" alt="user uploaded image" src={a} />
                    })}

                    {/* Message Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-600/20">
                        <button onClick={copy} class="cursor-pointer p-1 rounded transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
                            {copied.value ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        {isUserMsg ? !props.readOnly && <>
                            <button
                                onClick={() => props.message.value = props.msg.content}
                                class="cursor-pointer p-1 rounded transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                onClick={resend}
                                class="cursor-pointer p-1 rounded transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <RefreshCcw size={14} />
                            </button>
                        </> : <button
                            onClick={branch}
                            class="cursor-pointer p-1 rounded transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            {branchStatus.value === 'loading' ? <Spinner small /> : branchStatus.value === 'failed' ? <CircleX size={14} /> : <GitBranch size={14} />}
                        </button>}
                    </div>
                </div>
            </div>
        </div>}
        {props.msg.error && <div className="flex justify-center">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg
                bg-red-50 border border-red-200 text-red-700 
                dark:bg-red-900/20 dark:border dark:border-red-800/30 dark:text-red-400
            `}>
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="text-sm">{props.msg.error}</span>
                {isUserMsg && <button onClick={() => {
                    db.remove(chatMessage, props.id);
                    resend();
                }}
                    className={`text-sm font-medium underline hover:no-underline transition-all cursor-pointer
                        text-red-600 hover:text-red-800
                        dark:text-red-300 dark:hover:text-red-200 
                    `}
                >
                    Retry
                </button>}
            </div>
        </div>}
    </>
}

function getModelIcon(modelId: string): FunctionalComponent<{
    height: number;
    width: number;
}> {
    return models.find(m => m.id === modelId)?.icon ?? (() => undefined);
}