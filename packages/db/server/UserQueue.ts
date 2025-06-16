type Action = () => Promise<void> | void;

export class UserQueue {
    #userQueues: Map<string, (() => void)[]> = new Map();

    syncUserAction(user: string, action: Action): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let userQueue = this.#userQueues.get(user)
            if (userQueue === undefined) {
                userQueue = [];
                this.#userQueues.set(user, []);
            } else {
                await new Promise<void>(resolve => userQueue!.push(resolve));
            }

            try {
                await action();
                resolve();
            } catch (err) {
                reject(err);
            }

            const next = userQueue.shift();
            if (next !== undefined) {
                next();
            } else {
                this.#userQueues.delete(user);
            }
        })
    }
}   
