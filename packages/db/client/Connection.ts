import { TypedEmitter } from 'tiny-typed-emitter';
import type { ClientHelloData, Message, MessageDataMap, MessageType } from "../shared/messages.js";

type MessageEvents = {
    [K in keyof MessageDataMap]: (data: MessageDataMap[K], ack?: string) => void;
};

export const SyncTimeoutError = new Error('Sync timeout.');

export class Connection extends TypedEmitter<MessageEvents> {
    #wsUrl: string;
    #ws?: WebSocket;
    #connected = false;
    #clientHelloHandler: () => Promise<ClientHelloData>
    #writeQueue: { msg: string, resolve: (v: any) => void }[] = [];
    #timeoutMs: number;
    #pendingMsgs = new Map<string, () => void>();
    #destroyed = false;

    constructor(wsUrl: string, clientHelloHandler: () => Promise<ClientHelloData>, timeoutMs: number) {
        super();
        this.#wsUrl = wsUrl;
        this.#clientHelloHandler = clientHelloHandler;
        this.#timeoutMs = timeoutMs;
        this.#connect();

        window.addEventListener('beforeunload', () => {
            this.destroy();
        })
    }

    #connect() {
        this.#ws = new WebSocket(this.#wsUrl);

        this.#ws.onopen = async () => {
            this.#connected = true;
            await this.#clientHello();
            if (this.#ws!.readyState === WebSocket.OPEN) {
                this.#consumeWriteQueue();
            }
        }

        this.#ws.onmessage = msg => {
            this.#handleMessage(msg.data.toString());
        }

        this.#ws.onclose = () => {
            if (this.#destroyed) return;
            console.warn('WebSocket connection lost. Reconnecting...');
            this.#connected = false;
            this.#connect();
        }
    }

    async #clientHello() {
        const ws = this.#ws;
        const clientHello = await this.#clientHelloHandler();
        // Ensure the open WebSocket is still the same
        if (this.#connected && ws === this.#ws) {
            this.send({
                type: "client_hello",
                data: clientHello
            })
        }
    }

    #consumeWriteQueue() {
        for (const msg of this.#writeQueue) {
            msg.resolve(this.#ws!.send(msg.msg));
        }
        this.#writeQueue = [];
    }

    #handleMessage(data: string) {
        const json = JSON.parse(data);

        if (typeof json.ack === 'string') {
            const resolve = this.#pendingMsgs.get(json.ack);
            if (resolve) resolve();
        }

        this.emit(json.type, json.data, json.ack);
    }

    send(msg: Message<MessageType>) {
        const json = JSON.stringify(msg);
        if (this.#connected) {
            this.#ws!.send(json);

            return new Promise<void>((resolve, reject) => {
                if (msg.msgId) {
                    this.#pendingMsgs.set(msg.msgId, resolve);
                } else {
                    resolve();
                }

                if (msg.msgId) {
                    setTimeout(() => {
                        this.#pendingMsgs.delete(msg.msgId!)
                        reject(SyncTimeoutError);
                    }, this.#timeoutMs);
                }
            })
        } else {
            return new Promise<void>((resolve, reject) => {
                this.#writeQueue.push({ msg: json, resolve });

                setTimeout(() => {
                    this.#writeQueue = this.#writeQueue.filter(v => v.resolve !== resolve)
                    reject(SyncTimeoutError);
                }, this.#timeoutMs);
            })
        }
    }

    destroy() {
        this.#destroyed = true;
        this.#ws?.close();
    }

    reconnect() {
        this.#ws?.close();
    }
}