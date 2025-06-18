import { FunctionalComponent } from 'preact';
import { Send, Search, Paperclip, MessageSquareText, Share } from 'lucide-preact';
import GeminiIcon from "../../icons/Gemini.tsx";
import { ModelSelectionModal } from './ModelSelectionModal.tsx';
import { Signal, useSignal, useSignalEffect } from '@preact/signals';
import { useCallback, useEffect, useMemo, useRef } from 'preact/hooks';
import Sidebar from './Sidebar.tsx';
import Examples from './Examples.tsx';
import { useLocation, useRoute } from 'preact-iso';
import { useChat, useDB } from '../../db.tsx';
import { chatMessage } from '@t3-chat-clone/stores';
import Messages from './Messages.tsx';
import { SyncTimeoutError } from '../../../../db/client/Connection.ts';
import { Model, models } from '../../models.ts';

export function Chat() {
	return <div className={`overflow-y-hidden flex h-dvh font-sans bg-gray-50 dark:bg-gray-900`}>
		<Sidebar />
		<ChatInterface />
	</div>
};

function ChatInterface() {
	const route = useRoute();
	const location = useLocation();
	const message = useSignal('');
	const isModelModalOpen = useSignal(false);
	const selectedModel = useSignal(models.find(m => m.id === localStorage.getItem('selected_model_id')) ?? models.find(m => m.id === 'llama-3.1-8b-instant')!);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const settings = useSignal<ChatSettings>({ search: false, shortResponse: false });
	const db = useDB();

	useSignalEffect(() => {
		localStorage.setItem('selected_model_id', selectedModel.value.id);
	})

	const chat = useChat(route.params.id ?? null);

	useEffect(() => {
		scrollToBottomOfChat();
	}, [])

	const sendMessage = useCallback((msg?: string) => {
		msg = msg ?? message.value.trim();
		const msgChatId = route.params.id ?? crypto.randomUUID();
		if (msg) {
			const pushResult = db.push(chatMessage, {
				chatId: msgChatId,
				copied: 0,
				role: 'user',
				content: msg,
				model: selectedModel.value.id,
				search: settings.value.search ? 1 : 0,
				short: settings.value.shortResponse ? 1 : 0,
				error: null,
				createdAt: Date.now()
			})
			pushResult.catch(err => {
				if (err === SyncTimeoutError) {
					db.editMemory(chatMessage, pushResult.id, {
						error: 'Sync timed out.'
					})
				} else {
					console.error(err);
					db.editMemory(chatMessage, pushResult.id, {
						error: 'An unexpected error occured.'
					})
				}
			})
			if (!route.params.id) {
				location.route(`/chat/${msgChatId}`);
			}
			message.value = '';
			scrollToBottomOfChat();
		}
	}, [route.params.id, message]);

	const handleKeyPress = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const handleModelSelect = (model: Model) => {
		selectedModel.value = model;
		isModelModalOpen.value = false;
	};

	// Auto-resize textarea
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

	return (
		<div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-800`}>
			{/* Main Content Area */}
			{chat.value && chat.value.length > 0 ? <Messages messages={chat} sendMessage={sendMessage} message={message} /> : <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
				<Examples onMessage={m => {
					message.value = m;
					sendMessage();
				}} />
			</div>}

			{/* Message Input Area */}
			<div className={`border-t p-6 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900`}>
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
							placeholder="Type your message here..."
							rows={1}
							className={`w-full px-4 py-3 pr-12 rounded-lg resize-none min-h-[44px] leading-[24px] overflow-y-hidden
								bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400
								dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-gray-500 
								border focus:outline-none focus:ring-1 focus:ring-blue-500/20`}
						/>
						<button
							onClick={() => sendMessage()}
							disabled={!message.value.trim()}
							className={`absolute right-2 mr-8 top-2 p-2 rounded-md ${message.value.trim()
								? `text-purple-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700`
								: 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
								}`}
						>
							<Send size={18} />
						</button>
						<button
							onClick={() => sendMessage()}
							disabled={!message.value.trim()}
							className={`absolute right-2 top-2 p-2 rounded-md ${message.value.trim()
								? `text-purple-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700`
								: 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
								}`}
						>
							<Share size={18} />
						</button>
					</div>

					{/* Footer Info */}
					<div className="flex items-center justify-between mt-4 text-xs">
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
							<ChatControls model={selectedModel.value} settings={settings} />
						</div>
					</div>
				</div>
			</div>

			{/* Model Selection Modal */}
			<ModelSelectionModal
				isOpen={isModelModalOpen}
				selectedModel={selectedModel}
				onClose={() => { isModelModalOpen.value = false }}
				onSelectModel={handleModelSelect}
			/>
		</div >
	);
}

type ChatSettings = {
	search: boolean;
	shortResponse: boolean;
}

function ChatControls(props: { model: Model, settings: Signal<ChatSettings> }) {
	const toggle = (key: keyof ChatSettings) => {
		props.settings.value[key] = !props.settings.value[key];
		props.settings.value = { ...props.settings.value };
	}

	return <>
		{props.model.capabilities.search ? <ChatControl name="Search" onClick={() => toggle('search')} enabled={props.settings.value.search} icon={Search} /> : undefined}
		{props.model.capabilities.files ? <ChatControl name="Attach" enabled={false} icon={Paperclip} /> : undefined}
		<ChatControl name="Short Response" onClick={() => toggle('shortResponse')} enabled={props.settings.value.shortResponse} icon={MessageSquareText} />
	</>
}

function ChatControl(props: { name: string, onClick?: () => void, enabled: boolean, icon: FunctionalComponent<{ size: number | string }> }) {
	return <button onClick={props.onClick} className={`flex items-center p-2 rounded-full gap-1 cursor-pointer
		bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 shadow-sm border border-gray-200
		dark:bg-transparent dark:border-gray-700 dark:border-2 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-white
		${props.enabled ? '!border-purple-600' : ''}
	`}>
		<props.icon size={12} />
		<span class="hidden lg:block">{props.name}</span>
	</button>
}

function scrollToBottomOfChat() {
	setTimeout(() => {
		const messagesDisplay = document.getElementById('messages-display') as HTMLDivElement;
		if (messagesDisplay) {
			messagesDisplay.scrollTop = messagesDisplay.scrollHeight
		}
	}, 0)
}