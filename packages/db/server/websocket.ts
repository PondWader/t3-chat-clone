import { ServerWebSocket, WebSocketHandler } from "bun";
import { Database } from "./index.js";
import { clientHelloData, type Message, type MessageType } from "../shared/messages.js";
import { Store } from "../index.js";
import { specialColumns } from "./database.js";

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
                        id: e.id
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
                // TODO: Sync here
                data.syncStatus

                ws.data.synced = true;
            } else if (ws.data.synced) {
                switch (msg.type) {
                    case "push":
                        // NOTE: IF an ID is received that is less than the highest ID the data should be removed then rewritten
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

async function syncStore(db: Database, ws: ServerWebSocket<ConnData>, store: Store<any>, lastId: string | null) {
    let unsyncedObjs: any[];
    if (lastId === null) {
        unsyncedObjs = await db.dbConn.queryAll(store.name, {
            $userId: ws.data.user
        }, {
            $id: 'desc'
        })
    } else {
        unsyncedObjs = await db.dbConn.queryAll(store.name, {
            $id: {
                ge: lastId
            },
            $userId: ws.data.user
        }, {
            $id: 'desc'
        })
    }

    for (const obj of unsyncedObjs) {
        const id = obj.$id;

        for (const colName of Object.keys(specialColumns)) {
            delete obj[colName];
        }

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
}