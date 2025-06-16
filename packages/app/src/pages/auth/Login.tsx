import { useSignal } from '@preact/signals';
import { ArrowLeft, Smartphone, Shield, Users, Zap, AlertCircle } from 'lucide-preact';
import Spinner from '../../components/Spinner';
import { login, useAuthUrls } from '../../auth';
import { useLocation } from 'preact-iso';
import { useEffect } from 'preact/hooks';
import { useDB } from '../../db';

export default function Login() {
    const location = useLocation();
    const authUrls = useAuthUrls();
    const error = useSignal<string>();
    const discordLoading = useSignal(false);
    const db = useDB();

    const handleDiscordLogin = () => {
        discordLoading.value = true
        authUrls.then(urls => {
            window.open(urls.discord, '_self');
        });
    };

    useEffect(() => {
        if (!location.query.code) return;

        discordLoading.value = true;
        const { code, state } = location.query;
        login('Discord', code, state).then(() => {
            db.reconnect();
            location.route('/');
        }).catch(err => {
            error.value = err.message ?? err;
            discordLoading.value = false;
        });
    }, [location.query]);


    return (
        <div className="h-screen flex-1 flex flex-col bg-gray-50 dark:bg-gray-800">
            {/* Header */}
            <div className="border-b px-6 py-4 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                    <a
                        href="/"
                        className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </a>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Connect to keep access to your chats
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Choose how you'd like to get started
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="max-w-md w-full">

                    {/* Logo/Icon */}
                    <div className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 dark:from-purple-600 dark:to-blue-600">
                        <span className="text-white text-2xl font-bold"></span>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                            Get Started
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Sign in to sync your conversations across all devices, or continue without an account.
                        </p>
                    </div>

                    {/* Error */}
                    {error.value && <div className="flex justify-center my-2 mb-4">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg 
                            dark:bg-red-900/20 dark:border dark:border-red-800/30 dark:text-red-400
                            bg-red-50 border border-red-200 text-red-700`}>
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span className="text-sm">Failed to login: {error.value}</span>
                        </div>
                    </div>}

                    {/* Login Options */}
                    <div className="space-y-4 mb-8">
                        {/* Discord Login */}
                        <button
                            onClick={handleDiscordLogin}
                            class="cursor-pointer w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] bg-[#5865F2] hover:bg-[#4752C4] text-white"
                        >
                            {!discordLoading.value ? <DiscordIcon /> : <Spinner />}
                            <span>Continue with Discord</span>
                        </button>

                        {/* Sync Without Account */}
                        <a
                            href="/sync"
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 shadow-sm dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 dark:hover:border-gray-600"
                        >
                            <Smartphone size={20} />
                            <span>Sync devices without account</span>
                        </a>
                    </div>

                    {/* Features */}
                    <div className="p-6 rounded-xl bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Why sign in?</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                    <Users size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Sync Across Devices
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Access your conversations anywhere
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Shield size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Secure Backup
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Never lose your chat history
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Increased Limits
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Chat for longer with less chance to hit limits
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

};

function DiscordIcon() {
    return <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
    </div>
}