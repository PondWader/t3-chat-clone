import { ServerWebSocket, WebSocketHandler } from "bun";
import { Database } from "./index.js";
import { clientHelloData, type Message, type MessageType } from "../shared/messages.js";

type ConnData = {
    synced: boolean;
    user: string;
}

export function createWsBinding(db: Database): WebSocketHandler<ConnData> {
    const connections = new Map<string, ServerWebSocket<ConnData>[]>();

    for (const store of db.stores.values()) {
        db.subscribe(store, (e, ctx) => {
            const conns = connections.get(e.user);
            if (conns === undefined) return;

            let msg: Message<MessageType>;
            if (e.action === 'push' || e.action === 'partial') {
                msg = {
                    type: e.action,
                    data: {
                        store: store.name,
                        object: e.object,
                        id: e.id,
                        clientId: e.clientId
                    }
                }
            } else if (e.action === 'remove') {
                msg = {
                    type: 'remove',
                    data: {
                        store: store.name,
                        id: e.id
                    }
                }
            } else {
                return;
            }

            for (const conn of conns) {
                conn.send(JSON.stringify(msg));
            }
        })
    }

    return {
        message(ws, message) {
            const msg = JSON.parse(message.toString()) as Message<MessageType>;

            if (!ws.data.synced && msg.type === 'client_hello') {
                const result = clientHelloData.safeParse(msg.data);
                if (!result.success) {
                    return;
                }
                const data = result.data;

                const arr = connections.get(ws.data.user);
                if (arr === undefined) {
                    connections.set(ws.data.user, [ws]);
                } else {
                    arr.push(ws);
                }

                // TODO: Sync here
                data.syncStatus
            } else if (ws.data.synced) {
                switch (msg.type) {
                    case "push":
                        break;
                    case "remove":
                        break;
                }
            }
        },
        open(ws) {
            ws.data.synced = false;
        },
        close(ws) {
            const userConns = connections.get(ws.data.user);
            if (userConns && userConns.length === 1 && userConns[0] === ws) {
                connections.delete(ws.data.user);
            } else if (userConns) {
                connections.set(ws.data.user, userConns.filter(v => v !== ws))
            }
        },
    }
}