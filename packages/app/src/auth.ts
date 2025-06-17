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
    }), []);
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
    if (resp.status !== 204 && resp.status !== 200) {
        let json;
        try {
            json = await resp.json();
        } catch {
            throw new Error(`received unexpected status code: ${resp.status}`);
        }
        if (json.error === true) throw new Error(json.message);
    }
}

function getSecureState() {
    const persistedState = localStorage.getItem('login_state');
    if (persistedState) return persistedState;

    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    const state = bufToHex(buf);

    localStorage.setItem('login_state', state);
    return state;
}

function bufToHex(b: Uint8Array) {
    return new Array<number>(...b).map(v => v.toString(16).padStart(2, " ")).join('');
}