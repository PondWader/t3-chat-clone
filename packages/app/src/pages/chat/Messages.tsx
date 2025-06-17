import { AlertCircle, Copy, ThumbsDown, ThumbsUp } from "lucide-preact";
import Gemini from "../../icons/Gemini";
import { ObjectInstance, storeObject } from "@t3-chat-clone/db";
import { account, chatMessage } from "@t3-chat-clone/stores";
import { Signal } from "@preact/signals";
import { useAccount, useDB } from "../../db";
import Avatar from "../../icons/Avatar";
import Markdown from "../../components/Markdown";

export default function Messages(props: { messages: Signal<ObjectInstance<storeObject<typeof chatMessage>>[]>, sendMessage: (msg: string) => void }) {
    const account = useAccount();

    const lastMsg = props.messages.value[props.messages.value.length - 1];
    const isLoading = lastMsg.object.role === "user" && !lastMsg.object.error;

    return <div className="flex-1 overflow-y-auto p-6 flex-col-reverse" id="messages-display">
        <div className="max-w-[90vw] lg:max-w-[min(56rem,70vw)] mx-auto space-y-6 mb-[300px]">
            {props.messages.value.map((msg, i) => (
                <Message account={account} msg={msg.object} id={msg.id} isLastMsg={i + 1 === props.messages.value.length} sendMessage={props.sendMessage} />
            ))}

            {/* Loading Message */}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                        {/* AI Avatar */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                            <Gemini width={16} height={16} />
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

function Message(props: { msg: storeObject<typeof chatMessage>, id: string, account: Signal<storeObject<typeof account> | null>, isLastMsg: boolean, sendMessage: (msg: string) => void }) {
    const db = useDB();

    const isUserMsg = props.msg.role === 'user';

    return <>
        <div
            key={props.id}
            className={`flex ${isUserMsg ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`flex gap-3 max-w-[90%] lg:max-w-[80%] ${isUserMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 dark:bg-gray-700`}>
                    {isUserMsg ? (
                        props.account.value && props.account.value.avatarUrl ? <img class="rounded-full" width="40" height="40" src={props.account.value.avatarUrl ?? ''} /> : <Avatar />
                    ) : (
                        <Gemini height={16} width={16} />
                    )}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 min-w-0 bg-white text-gray-900 border border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-transparent`}>
                    <div className="text-sm leading-relaxeds overflow-hidden break-words overflow-wrap-anywhere">
                        <Markdown>{props.msg.content}</Markdown>
                    </div>

                    {/* Message Actions */}
                    {!isUserMsg && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-600/20">
                            <button className="p-1 rounded transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
                                <Copy size={14} />
                            </button>
                            <button className="p-1 rounded transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
                                <ThumbsUp size={14} />
                            </button>
                            <button className="p-1 rounded transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
                                <ThumbsDown size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
        {props.msg.error && isUserMsg && <div className="flex justify-center">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg
                bg-red-50 border border-red-200 text-red-700 
                dark:bg-red-900/20 dark:border dark:border-red-800/30 dark:text-red-400
            `}>
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="text-sm">{props.msg.error}</span>
                <button onClick={() => {
                    db.remove(chatMessage, props.id);
                    props.sendMessage(props.msg.content);
                }}
                    className={`text-sm font-medium underline hover:no-underline transition-all cursor-pointer
                        text-red-600 hover:text-red-800
                        dark:text-red-300 dark:hover:text-red-200 
                    `}
                >
                    Retry
                </button>
            </div>
        </div>}
    </>
}