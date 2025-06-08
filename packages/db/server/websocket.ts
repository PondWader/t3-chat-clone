import { WebSocketHandler } from "bun";
import { Database } from "./index.js";

export function createWsBinding(db: Database): WebSocketHandler {
    return {
        message(ws, message) {
            const json = JSON.parse(message.toString());
        },
        open(ws) { },
        close(ws, code, message) { },
    }
}