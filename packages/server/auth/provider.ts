import z, { ZodObject } from "zod/v4";
import { AuthHandler } from ".";

export type AuthProvider<T, P extends string> = {
    name: string;
    callbackParams: P[];
    config: ZodObject;
    getUrl: (config: T, state: string) => string;
    authenticate: (handler: AuthHandler, config: T, params: Record<P, string>) => Promise<Response>;
}

export function createAuthProvider<T extends ZodObject, P extends string>(opts: {
    name: string,
    config: T,
    callbackParams: P[],
    getUrl: (config: z.infer<T>, state: string) => string,
    authenticate: (handler: AuthHandler, config: z.infer<T>, params: Record<P, string>) => Promise<Response>
}): AuthProvider<z.infer<T>, P> {
    return {
        name: opts.name,
        callbackParams: opts.callbackParams,
        config: opts.config,
        getUrl: opts.getUrl,
        authenticate: opts.authenticate
    };
}