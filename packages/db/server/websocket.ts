import { WebSocketHandler } from "bun";
import { Database } from "./index.js";

export function createWsBinding(db: Database): WebSocketHandler {
    console.log(db);
    return {
        message(ws, message) {
            const json = JSON.parse(message.toString());
            console.log(ws, json)
        },
        open(ws) {
            console.log(ws)
        },
        close(ws, code, message) {
            console.log(ws, code, message);
        },
    }
}