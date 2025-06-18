import { ServerWebSocket, WebSocketHandler } from "bun";
import { Database } from "./index.js";
import { clientHelloData, pushData, PushData, RemoveData, removeData, type Message, type MessageType } from "../shared/messages.js";
import { Store } from "../index.js";
import { cleanRecord } from "./database.js";

type ConnData = {
    synced: boolean;
    user: string;
}

export function createWsBinding(db: Database): WebSocketHandler<ConnData> {
    const connections = new Map<string, ServerWebSocket<ConnData>[]>();

    for (const store of db.stores.values()) {
        db.subscribe(store, (e) => {
            const conns = connections.get(e.user);
            if (conns === undefined) return;

            let msg: Message<MessageType>;
            if (e.action === 'push' || e.action === 'partial') {
                msg = {
                    type: e.action,
                    ack: e.msgId,
                    data: {
                        store: store.name,
                        object: e.object,
                        id: e.id
                    }
                }
            } else if (e.action === 'remove') {
                msg = {
                    type: 'remove',
                    ack: e.msgId,
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

    function handlePush(user: string, data: PushData, msgId?: string) {
        const store = db.stores.get(data.store);
        if (store === undefined) return;
        if (!store.validateClientActionSafe("push", data.object)) return;

        db.push(store, user, data.object, msgId);
    }

    async function handleRemove(user: string, data: RemoveData, msgId?: string) {
        const store = db.stores.get(data.store);
        if (store === undefined) return;
        const obj = await db.getAll(store, user, "$id", data.id);
        if (obj.length === 0) return;
        if (!store.validateClientActionSafe("remove", obj[0].object)) return;

        db.remove(store, user, data.id, msgId);
    }

    return {
        async message(ws, message) {
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

                for (const storeName of Object.keys(data.syncStatus)) {
                    const status = data.syncStatus[storeName];
                    const store = db.stores.get(storeName);
                    if (store === undefined) {
                        ws.close();
                        return;
                    }

                    await syncStore(db, ws, store, status);
                }

                ws.data.synced = true;
            } else if (ws.data.synced) {
                if (msg.type === 'push') {
                    const result = pushData.safeParse(msg.data);
                    if (!result.success) return;
                    handlePush(ws.data.user, result.data, msg.msgId);
                } else if (msg.type === 'remove') {
                    const result = removeData.safeParse(msg.data);
                    if (!result.success) return;
                    handleRemove(ws.data.user, result.data, msg.msgId);
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

function syncStore(db: Database, ws: ServerWebSocket<ConnData>, store: Store<any>, lastId: string | null) {
    return db.userQueue.syncUserAction(ws.data.user, async () => {
        let unsyncedObjs: any[];
        if (lastId === null) {
            unsyncedObjs = await db.dbConn.queryAll(store.name, {
                $userId: ws.data.user,
                $deleted: 0
            }, {
                $id: 'desc'
            })
        } else {
            // If the message doesn't exist everything should be resynced from the start
            const lastSynced = await db.dbConn.query(store.name, {
                $id: lastId,
                $userId: ws.data.user,
            })
            if (lastSynced === null) {
                const msg: Message<"clear"> = {
                    type: "clear",
                    data: {
                        store: store.name
                    }
                }
                ws.send(JSON.stringify(msg));

                unsyncedObjs = await db.dbConn.queryAll(store.name, {
                    $userId: ws.data.user,
                    $deleted: 0
                }, {
                    $id: 'desc'
                })
            } else {
                unsyncedObjs = await db.dbConn.queryAll(store.name, {
                    $id: {
                        gt: lastId
                    },
                    $userId: ws.data.user,
                    $deleted: 0
                }, {
                    $id: 'desc'
                })
            }
        }

        for (const obj of unsyncedObjs) {
            const id = obj.$id;

            cleanRecord(obj);

            const msg: Message<"push"> = {
                type: 'push',
                data: {
                    object: obj,
                    store: store.name,
                    id: id
                }
            }

            ws.send(JSON.stringify(msg));
        }

        if (typeof lastId === 'string') {
            const deletions = await db.dbConn.queryAll('$deletions', {
                id: {
                    ge: lastId
                },
                store: store.name,
                userId: ws.data.user
            }) as any[]
            for (const deletion of deletions) {
                const msg: Message<"remove"> = {
                    type: 'remove',
                    data: {
                        store: store.name,
                        id: deletion.objectId
                    }
                }
                ws.send(JSON.stringify(msg));
            }
        }
    })
}