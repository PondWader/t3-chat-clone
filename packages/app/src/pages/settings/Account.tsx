import { LogIn, LogOut, Mail, Save, User } from "lucide-preact";
import Layout from "./_layout";
import { useAccount, useDB } from "../../db";
import { useLocation } from "preact-iso";

export default function AccountSettings() {
    const location = useLocation();
    const account = useAccount();
    const db = useDB();

    const logout = async () => {
        const resp = await fetch('/api/auth/logout', { method: 'POST' });
        if (resp.ok) {
            db.reconnect();
            location.route('/');
        }
    }

    return <Layout>
        {account.value && <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Account Information</h2>

            <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                    {account.value.avatarUrl ? <img class="rounded-full" width="80" height="80" alt="user avatar" src={account.value.avatarUrl} /> :
                        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-2xl font-medium">{account.value.displayName[0]}</span>
                        </div>}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{account.value.displayName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Authenticated with Discord</p>
                    </div>
                </div>

                {/* Username */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <User size={16} className="inline mr-2" />
                        Username
                    </label>
                    <input
                        type="text"
                        disabled={true}
                        value={account.value.username}
                        readOnly
                        class="w-full px-4 py-3 rounded-lg border bg-gray-50 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <Mail size={16} className="inline mr-2" />
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={account.value.email}
                        disabled={true}
                        class="cursor-not-allowed w-full px-4 py-3 rounded-lg border bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                </div>

                {/* Save Button */}
                <button onClick={logout} className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-red-700 hover:bg-red-800 text-white dark:bg-red-800 dark:hover:bg-red-900">
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </div>}
        {!account.value && <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Not logged in.</h2>
            <a href="/login" class="w-fit cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-purple-400 hover:bg-purple-500 text-white dark:bg-purple-600 dark:hover:bg-purple-700">
                <LogIn size={16} />
                Login
            </a>
        </div>}
    </Layout>
}