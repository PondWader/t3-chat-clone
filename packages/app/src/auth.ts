import { useMemo } from "preact/hooks";

export type AuthUrls = {
    discord: string;
}

export function useAuthUrls() {
    return useMemo(() => new Promise<AuthUrls>(resolve => {
        let backoff = 25;
        const loadUrls = () => {
            fetch(`/api/auth/url?state=${encodeURIComponent(getSecureState())}`)
                .then(res => {
                    if (res.status === 200) return res.json();
                    console.error(`Failed to get auth URLs, got status: ${res.status}`);
                    if (backoff > 6000) backoff = 6000;
                    setTimeout(loadUrls, backoff *= 4)
                })
                .then(json => {
                    resolve(json)
                })
                .catch(err => {
                    console.error(`Failed to get auth URLs, got error: ${err}`);
                    if (backoff > 6000) backoff = 6000;
                    setTimeout(loadUrls, backoff *= 4)
                })
        }
        loadUrls();
    }), undefined);
}

export async function login(provider: string, code: string, state: string) {
    const loginState = getSecureState();
    if (loginState !== state) {
        throw new Error('Unexpected login state. Try again.')
    }

    const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            provider,
            params: {
                code,
                state
            }
        })
    })
}

function getSecureState() {
    const persistedState = localStorage.getItem('login_state');
    if (persistedState) return persistedState;

    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    const state = buf.toHex();

    localStorage.setItem('login_state', state);
    return state;
}