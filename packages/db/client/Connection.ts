import { TypedEmitter } from 'tiny-typed-emitter';
import type { ClientHelloData, Message, MessageDataMap, MessageType } from "../shared/messages.js";

type MessageEvents = {
    [K in keyof MessageDataMap]: (data: MessageDataMap[K]) => void;
};

export class Connection extends TypedEmitter<MessageEvents> {
    #wsUrl: string;
    #ws?: WebSocket;
    #writeQueue: string[] = [];
    #connected = false;
    #clientHelloHandler: () => Promise<ClientHelloData>

    constructor(wsUrl: string, clientHelloHandler: () => Promise<ClientHelloData>) {
        super();
        this.#wsUrl = wsUrl;
        this.#clientHelloHandler = clientHelloHandler;
        this.#connect();
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
            this.#ws!.send(msg);
        }
        this.#writeQueue = [];
    }

    #handleMessage(data: string) {
        const json = JSON.parse(data);
        this.emit(json.type, json.data);
    }

    send(msg: Message<MessageType>) {
        const json = JSON.stringify(msg);
        if (this.#connected) {
            this.#ws!.send(json);
        } else {
            this.#writeQueue.push(json);
        }
    }
}