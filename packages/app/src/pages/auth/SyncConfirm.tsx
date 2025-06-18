import { Signal, useSignal } from "@preact/signals";
import { AlertCircle, ArrowLeft, Check, FileWarning, Smartphone } from "lucide-preact";
import Spinner from "../../components/Spinner";
import { LocationHook, useLocation, useRoute } from "preact-iso";
import { useDB } from "../../db";
import { Client } from "@t3-chat-clone/db/client";

export default function SyncConfirm() {
    const route = useRoute();
    const error = useSignal<string>();
    const loading = useSignal<boolean>();
    const db = useDB();
    const location = useLocation();

    const link = async () => {
        loading.value = true;
        await generateSyncCode(location, route.params.code, db, error);
        loading.value = false;
    }

    return <div class="flex h-screen">
        <div className="flex-1 flex flex-col dark:bg-gray-800 bg-gray-50">
            {/* Header */}
            <div className="border-b px-6 py-4 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => history.go(-1)}
                        className="cursor-pointer p-2 rounded-lg transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Sync Between Devices
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Connect your devices to sync conversations and settings
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-md w-full text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                        <Smartphone size={32} />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                        Sync Between Devices
                    </h2>

                    {error.value && <div className="flex justify-center my-2 mb-4">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg 
                            dark:bg-red-900/20 dark:border dark:border-red-800/30 dark:text-red-400
                            bg-red-50 border border-red-200 text-red-700`}>
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span className="text-sm">Error syncing device: {error.value}</span>
                        </div>
                    </div>}

                    <p className="text-sm mb-8 text-gray-600 dark:text-gray-400">
                        Confirm syncing your chats and settings with another device. Your current chats and settings on this device will be lost.
                    </p>

                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-4
                            dark:bg-red-900/20 dark:border dark:border-red-800/30 dark:text-red-400
                            bg-red-50 border border-red-200 text-red-700`}>
                        <FileWarning size={16} className="flex-shrink-0" />
                        <span className="text-sm">Do not proceed if you are not syncing with a device you own! This action will grant access to your chat history to another device.</span>
                    </div>

                    <button
                        onClick={link}
                        disabled={loading.value}
                        class="cursor-pointer w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] bg-purple-600 hover:bg-purple-700 text-white mb-2"
                    >
                        {!loading.value ? <Check /> : <Spinner />}
                        <span>Confirm Device Link</span>
                    </button>

                    <a
                        href="/"
                        class="cursor-pointer w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] bg-gray-600 hover:bg-gray-700 text-white"
                    >
                        Cancel
                    </a>
                </div>
            </div>
        </div>
    </div >
}

async function generateSyncCode(loc: LocationHook, syncCode: string, db: Client, error: Signal<string | undefined>) {
    try {
        const resp = await fetch(`/api/link`, {
            method: 'POST',
            body: JSON.stringify({
                code: syncCode
            }),
            headers: {
                'content-type': 'application/json'
            }
        });
        if (!resp.ok) {
            try {
                const json = await resp.json();
                if (json.error) {
                    error.value = json.message;
                    return;
                }
            } catch { }
            error.value = 'An unexpected error occured syncing devices!';
            return
        }

        db.reconnect();
        loc.route('/');
    } catch (err) {
        console.error(err);
        error.value = 'An unexpected error occured generating sync link!';
    }
}