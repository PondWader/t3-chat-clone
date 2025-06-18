import { Signal, useComputed, useSignal } from '@preact/signals';
import { ArrowLeft, Copy, Check, Smartphone, QrCode, RefreshCw, AlertCircle, FileWarning } from 'lucide-preact';
import { useEffect } from 'preact/hooks';
import Spinner from '../../components/Spinner';

export default function Sync() {
    const syncCode = useSignal<string>();
    const syncUrl = useComputed(() => window.location.origin + '/sync/' + syncCode.value);
    const error = useSignal<string>();
    const copied = useSignal(false);
    const hidden = useSignal(true);

    useEffect(() => {
        generateSyncCode(syncCode, error)
            .then(() => {
                if (syncCode.value) createQrCode(syncUrl.value);
            });
    }, []);

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(syncUrl.value);
            copied.value = true;
            setTimeout(() => copied.value = false, 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    };

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
                        Scan to Connect
                    </h2>

                    {error.value && <div className="flex justify-center my-2 mb-4">
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg 
                            dark:bg-red-900/20 dark:border dark:border-red-800/30 dark:text-red-400
                            bg-red-50 border border-red-200 text-red-700`}>
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span className="text-sm">Error generating link: {error.value}</span>
                        </div>
                    </div>}

                    {syncCode.value ? <>
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-3
                            dark:bg-red-900/20 dark:border dark:border-red-800/30 dark:text-red-400
                            bg-red-50 border border-red-200 text-red-700`}>
                            <FileWarning size={16} className="flex-shrink-0" />
                            <span className="text-sm">Do not share this link or QR code. It will grant access to your chat history and settings.</span>
                        </div>


                        <p className="text-sm mb-8 text-gray-600 dark:text-gray-400">
                            Scan this QR code or copy your unique link and sync your conversations across all devices.
                        </p>

                        {/* QR Code */}
                        <div className="mb-8 flex justify-center">
                            <div onClick={() => hidden.value = false} className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                                <div class={`max-w-[160] w-[160] h-[160] ${!hidden.value ? "hidden" : ""} flex flex-col justify-center items-center`}>
                                    <p class="text-gray-600 dark:text-gray-300">Click to reveal QR code</p>
                                </div>
                                <canvas class={hidden.value ? "hidden" : ""} width="160" height="160" id="qr-code-canvas" />
                            </div>
                        </div>

                        {/* Sync URL */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                                Or copy this link:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    onClick={() => hidden.value = false}
                                    disabled={!hidden.value}
                                    type="text"
                                    value={hidden.value ? 'Click to reveal' : syncUrl}
                                    readOnly
                                    className="flex-1 px-4 py-3 rounded-lg border text-sm font-mono bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 cursor-text "
                                />
                                <button
                                    onClick={handleCopyUrl}
                                    className={`cursor-pointer px-4 py-3 rounded-lg border transition-all duration-200 ${copied
                                        ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                                        }`}
                                >
                                    {copied.value ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-12 p-6 rounded-lg bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <QrCode size={20} className="text-purple-600 dark:text-purple-400" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    How to sync:
                                </h3>
                            </div>
                            <ol className="text-sm text-left space-y-2 text-gray-600 dark:text-gray-400">
                                <li>1. Use another device/browser</li>
                                <li>2. Scan the QR code or enter the link</li>
                                <li>3. Your conversations will sync automatically</li>
                            </ol>
                        </div>
                    </> : !error.value ? <Spinner /> : <></>}
                </div>
            </div>
        </div>
    </div>
};

async function generateSyncCode(syncCode: Signal<string | undefined>, error: Signal<string | undefined>) {
    try {
        const resp = await fetch(`/api/link/generate`, { method: 'POST' });
        if (!resp.ok) {
            try {
                const json = await resp.json();
                if (json.error) {
                    error.value = json.message;
                    return;
                }
            } catch { }
            error.value = 'An unexpected error occured generating sync link!';
            return
        }

        const json = await resp.json();
        syncCode.value = json.code
    } catch (err) {
        console.error(err);
        error.value = 'An unexpected error occured generating sync link!';
    }
}

async function createQrCode(data: string) {
    const qrcode = await import('qrcode');
    qrcode.toCanvas(document.getElementById('qr-code-canvas')!, data, {
        width: 160
    });
}