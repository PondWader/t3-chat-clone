import { FunctionalComponent } from 'preact';
import { Send, Sparkles, Book, Code, GraduationCap, Search, Paperclip, MessageSquareText } from 'lucide-preact';
import GeminiIcon from "../../icons/Gemini.tsx";
import { ModelSelectionModal } from './ModelSelectionModal.tsx';
import { useSignal } from '@preact/signals';
import { useRef } from 'preact/hooks';

const actionButtons = [
	{ icon: Sparkles, label: 'Create', color: 'text-purple-600' },
	{ icon: Book, label: 'Explore', color: 'text-blue-600' },
	{ icon: Code, label: 'Code', color: 'text-green-600' },
	{ icon: GraduationCap, label: 'Learn', color: 'text-orange-600' },
];

const sampleQuestions = [
	"How does AI work?",
	"Are black holes real?",
	"How many Rs are in the word 'strawberry'?",
	"What is the meaning of life?",
];

export function Home() {
	const message = useSignal('');
	const isModelModalOpen = useSignal(false);
	const selectedModel = useSignal('gemini-2.5-flash');
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSendMessage = () => {
		if (message.value.trim()) {
			message.value = '';
		}
	};

	const handleKeyPress = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleModelSelect = (modelId: string) => {
		selectedModel.value = modelId;
		isModelModalOpen.value = false;
	};

	const getModelDisplayName = (modelId: string) => {
		const modelMap: { [key: string]: string } = {
			'gemini-2.5-flash': 'Gemini 2.5 Flash',
			'gemini-2.5-pro': 'Gemini 2.5 Pro',
			'gpt-4o': 'GPT 4o',
			'gpt-4o-mini': 'GPT 4o-mini',
			'claude-4-sonnet': 'Claude 4 Sonnet',
			// Add more mappings as needed
		};
		return modelMap[modelId] || 'Gemini 2.5 Flash';
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
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="max-w-2xl w-full text-center">
					{/* Welcome Message */}
					<h1 className={`text-3xl font-bold mb-8 text-gray-900 dark:text-white`}>
						How can I help you, Pond?
					</h1>

					{/* Action Buttons */}
					<div className="flex justify-center gap-4 mb-12">
						{actionButtons.map((button) => {
							const IconComponent = button.icon;
							return (
								<button
									key={button.label}
									className={`flex items-center gap-2 px-4 py-2 rounded-lg 
										bg-white hover:bg-gray-100 text-gray-900 shadow-sm border border-gray-200
										dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-none
										`}
								>
									<IconComponent size={16} className={button.color} />
									<span className="text-sm font-medium">{button.label}</span>
								</button>
							);
						})}
					</div>

					{/* Sample Questions */}
					<div className="space-y-3">
						{sampleQuestions.map((question, index) => (
							<button
								key={index}
								onClick={() => message.value = question}
								className={`group relative block w-full text-left p-4 rounded-lg 
									dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:hover:text-white dark:border-none
									bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 shadow-sm border border-gray-200
									`}
							>
								<div className="flex items-center justify-between">
									<span className="text-sm pr-8">{question}</span>
									<Send
										size={16}
										className={`opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity duration-200 text-gray-500 dark:text-gray-400`}
									/>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>

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
							placeholder="Type your message here..."
							rows={1}
							className={`w-full px-4 py-3 pr-12 rounded-lg resize-none min-h-[44px] leading-[24px] overflow-y-hidden
								bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400
								dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-gray-500 
								border focus:outline-none focus:ring-1 focus:ring-blue-500/20`}
						/>
						<button
							onClick={handleSendMessage}
							disabled={!message.value.trim()}
							className={`absolute right-2 top-2 p-2 rounded-md ${message.value.trim()
								? `text-purple-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700`
								: 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
								}`}
						>
							<Send size={18} />
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
								<GeminiIcon height={16} width={16} />
								<span className="ml-sm">{getModelDisplayName(selectedModel.value)}</span>
							</button>
							<ChatControl name="Search" icon={Search} />
							<ChatControl name="Attach" icon={Paperclip} />
							<ChatControl name="Short Response" icon={MessageSquareText} />
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
};

function ChatControl(props: { name: string, icon: FunctionalComponent<{ size: number | string }> }) {
	return <button className={`flex items-center p-2 rounded-full gap-1 cursor-pointer
		bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 shadow-sm border border-gray-200
		dark:bg-transparent dark:border-gray-700 dark:border-2 dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-white
	`}>
		<props.icon size={12} />
		{props.name}
	</button>
}