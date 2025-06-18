import { ArrowLeft, Key, LucideIcon, User } from "lucide-preact";
import { ComponentChild } from "preact";
import Sidebar from "../../components/Sidebar";
import { useLocation } from "preact-iso";

export default function Layout(props: { children: ComponentChild }) {
    const location = useLocation();

    return <div class="flex h-screen">
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800">
            {/* Header */}
            <div className="border-b px-6 py-4 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => location.route('/')}
                        className="cursor-pointer p-2 rounded-lg  text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Sidebar Navigation */}
                <Sidebar>
                    <nav className="p-4 space-y-2">
                        <NavLink path="/settings" name="API Keys" icon={Key} />
                        <NavLink path="/settings/account" name="Account" icon={User} />

                    </nav>
                </Sidebar>

                {/* Main Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {props.children}
                </div>
            </div>
        </div>
    </div>
}

function NavLink(props: { path: string, name: string, icon: LucideIcon }) {
    const location = useLocation()

    return <a
        href={props.path}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left  ${location.path === props.path
            ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500/30'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
    >
        <props.icon size={16} />
        <span className="text-sm font-medium">{props.name}</span>
    </a>
}