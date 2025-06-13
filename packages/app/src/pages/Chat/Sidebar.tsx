import { Plus, Search, MessageSquare, Settings, Moon, Sun } from 'lucide-preact';
import { currentTheme, toggleTheme } from '../../theme';
import { useComputed } from '@preact/signals';

type ChatSession = {
    id: string;
    title: string;
    timestamp: string;
    category?: string;
}

const chatSessions: ChatSession[] = [
    { id: '1', title: 'Check for NullPointerError in J...', timestamp: 'Today', category: 'Today' },
    { id: '2', title: 'Prevent reconnect on page ch...', timestamp: 'Yesterday', category: 'Yesterday' },
    { id: '3', title: 'IndexedDB Delete All Rows', timestamp: '2 days ago', category: 'Last 7 Days' },
    { id: '4', title: 'Greeting', timestamp: '3 days ago', category: 'Last 7 Days' },
    { id: '5', title: 'TypeScript keyof T with string...', timestamp: '5 days ago', category: 'Last 7 Days' },
    { id: '6', title: 'Remove generic from TypeScr...', timestamp: '6 days ago', category: 'Last 7 Days' },
    { id: '7', title: 'TypeScript MessageDataMap...', timestamp: '1 week ago', category: 'Last 30 Days' },
    { id: '8', title: 'Linux view connections to port', timestamp: '2 weeks ago', category: 'Last 30 Days' },
    { id: '9', title: 'Disconnected SSH apt upgrade', timestamp: '3 weeks ago', category: 'Last 30 Days' },
];

export default function Sidebar() {
    return (
        <div className={`w-64 h-screen flex flex-col border-r 
            bg-white border-gray-200
            dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 dark:border-gray-700
        `}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h1 className={`text-lg font-semibold text-gray-900 dark:text-white`}>
                        TS Chat
                    </h1>
                    <ThemeToggle />
                </div>

                <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg 
                    dark:bg-purple-600 dark:hover:bg-purple-800 dark:text-white
                    bg-purple-500 hover:bg-purple-600 text-white
                `}>
                    <Plus size={16} />
                    <span className="text-sm font-medium">New Chat</span>
                </button>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400`} />
                    <input
                        type="text"
                        placeholder="Search your threads..."
                        className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm 
                            bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-300
                            dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-gray-600
                            border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                </div>
            </div>

            {/* Chat Sessions */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 pb-4">
                    {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'].map((category) => {
                        const sessionsInCategory = chatSessions.filter(session => session.category === category);
                        if (sessionsInCategory.length === 0) return null;

                        return (
                            <div key={category} className="mb-6">
                                <h3 className={`text-xs font-medium mb-2 px-2 text-gray-500 dark:text-gray-400`}>
                                    {category}
                                </h3>
                                <div className="space-y-1">
                                    {sessionsInCategory.map((session) => (
                                        <button
                                            key={session.id}
                                            className={`w-full text-left p-2 rounded-lg group 
                                                hover:bg-gray-100 text-gray-700 hover:text-gray-900
                                                dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-white
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MessageSquare size={14} className="flex-shrink-0" />
                                                <span className="text-sm truncate">{session.title}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* User Profile */}
            <div className={`p-4 border-t border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">P</span>
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-medium 'text-gray-900 dark:text-white`}>
                            Pond Wader
                        </p>
                        <p className={`text-xs text-gray-500 dark:text-gray-400`}>
                            Free
                        </p>
                    </div>
                    <button className={`p-1 rounded-md
                        hover:bg-gray-100 text-gray-500 hover:text-gray-700
                        dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white
                    `}>
                        <Settings size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

function ThemeToggle() {
    const icon = useComputed(() => currentTheme.value === 'dark' ? <Sun size={18} /> : <Moon size={18} />)

    return <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg  cursor-pointer
            dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-white
            hover:bg-gray-100 text-gray-600 hover:text-gray-900
        `}
    >
        {icon}
    </button>
}