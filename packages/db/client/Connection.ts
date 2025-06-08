export class Connection {
    #wsUrl: string;
    #ws?: WebSocket;

    constructor(wsUrl: string) {
        this.#wsUrl = wsUrl;
        this.#connect();
    }

    #connect() {
        this.#ws = new WebSocket(this.#wsUrl);

        this.#ws.onopen = () => {

        }

        this.#ws.onclose = () => {
            this.#connect();
        }
    }
}