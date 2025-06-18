import { signal } from "@preact/signals"
import Sidebar from "./Sidebar";
import { ChatInterface } from ".";
import { useLocation, useRoute } from "preact-iso";
import { ObjectInstance, storeObject } from "@t3-chat-clone/db";
import { chatMessage } from "@t3-chat-clone/stores";
import { useEffect, useMemo } from "preact/hooks";

export default function Shared() {
    const route = useRoute();
    const { chat, avatarUrl } = useShared(route.params.user, route.params.id);

    return <div className={`overflow-y-hidden flex h-dvh font-sans bg-gray-50 dark:bg-gray-900`}>
        <Sidebar />
        <ChatInterface chat={chat} avatarUrl={avatarUrl} readOnly={true} />
    </div>
}

function useShared(user: string, id: string) {
    const chat = useMemo(() => signal<ObjectInstance<storeObject<typeof chatMessage>>[]>([]), [user, id]);
    const avatarUrl = useMemo(() => signal<string>(), [user, id]);
    const location = useLocation();

    useEffect(() => {
        fetch(`/api/share/${user}/${id}`)
            .then(resp => {
                if (!resp.ok) {
                    location.route('/');
                    return;
                }
                return resp.json()
            })
            .then(json => {
                chat.value = json.messages;
                avatarUrl.value = json.avatarURL;
            })
            .catch(err => {
                console.error(err);
                location.route('/');
            })
    }, [user, id]);

    return { chat, avatarUrl };
}