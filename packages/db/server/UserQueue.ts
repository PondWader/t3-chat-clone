type Action<T> = () => Promise<T> | T;

export class UserQueue {
    #userQueues: Map<string, (() => void)[]> = new Map();

    syncUserAction<T>(user: string, action: Action<T>): Promise<T> {
        return new Promise(async (resolve, reject) => {
            let userQueue = this.#userQueues.get(user)
            if (userQueue === undefined) {
                userQueue = [];
                this.#userQueues.set(user, []);
            } else {
                await new Promise<void>(resolve => userQueue!.push(resolve));
            }

            try {
                resolve(await action());
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
