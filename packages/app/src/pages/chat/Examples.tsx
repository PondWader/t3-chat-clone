import { useSignal } from "@preact/signals";
import { Book, Code, GraduationCap, Send, Sparkles } from "lucide-preact";

const sampleCategories = [
    {
        icon: Sparkles,
        label: 'Create',
        color: 'text-purple-600',
        questions: [
            'Give me 5 ideas for short stories',
            'Write a Sci-Fi story about humans living with robots',
            'Help me with ideas for what to draw',
            'Describe an ancient ruin for my fictional story'
        ]
    },
    {
        icon: Book,
        label: 'Explore',
        color: 'text-blue-600',
        questions: [
            'Tell me 5 places in the world to explore',
            'Which city has the highest population in the world?',
            'Which pop stars are the most successful?',
            'How far away from Earth is Mars?'
        ]
    },
    {
        icon: Code,
        label: 'Code',
        color: 'text-green-600',
        questions: [
            'What\'s the fastest algorithm for sorting an array?',
            'Write a binary search algorithm in Python',
            'Create a SQL schema for the database of a bank',
            'How does a hash table work?'
        ]
    },
    {
        icon: GraduationCap,
        label: 'Learn',
        color: 'text-orange-600',
        questions: [
            'How much energy reaches the Earth from the sun each year?',
            'How long does an oak tree live for?',
            'What causes the sky to appear blue?',
            'How rare are diamonds?'
        ]
    },
];

const defaultExampleQuestions = [
    "Who was the first person to walk on the moon?",
    "What is the capital of France?",
    'Translate "Good morning" to Spanish.',
    "Make a short poem about pizza.",
];

export default function Examples(props: { onMessage: (msg: string) => void }) {
    const questions = useSignal(defaultExampleQuestions);

    return <div className="max-w-2xl w-full text-center">
        {/* Welcome Message */}
        <h1 className={`text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 text-gray-900 dark:text-white`}>
            How can I help you?
        </h1>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-2 lg:gap-4 mb-8 lg:mb-12">
            {sampleCategories.map((button) => {
                const IconComponent = button.icon;
                return (
                    <button
                        key={button.label}
                        onClick={() => questions.value = button.questions}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer
                            bg-white hover:bg-gray-100 text-gray-900 shadow-sm border border-gray-200
                            dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-transparent
                        `}
                    >
                        <IconComponent size={16} className={button.color} />
                        <span className="text-sm font-medium">{button.label}</span>
                    </button>
                );
            })}
        </div>

        <div className="space-y-3">
            {questions.value.map((question, index) => (
                <button
                    key={index}
                    onClick={() => props.onMessage(question)}
                    className={`group relative block w-full text-left p-3 lg:p-4 rounded-lg cursor-pointer
					dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:hover:text-white dark:border-transparent
					bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 shadow-sm border border-gray-200`}
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
}