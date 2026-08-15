import React from 'react';

import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

const createStorageMock = (): Partial<Storage> & {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    key: ReturnType<typeof vi.fn>;
} => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string): string | null => store[key] || null),
        setItem: vi.fn((key: string, value: string): void => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string): void => {
            delete store[key];
        }),
        clear: vi.fn((): void => {
            store = {};
        }),
        key: vi.fn(
            (index: number): string | null => Object.keys(store)[index] || null,
        ),
        get length() {
            return Object.keys(store).length;
        },
    };
};

if (globalThis.window !== undefined) {
    const localStorageMock = createStorageMock();
    const sessionStorageMock = createStorageMock();

    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('sessionStorage', sessionStorageMock);

    let matchMediaMatches = false;
    const matchMediaListeners = new Set<(e: { matches: boolean }) => void>();
    const matchMediaStub = vi.fn((_query: string) => ({
        get matches() {
            return matchMediaMatches;
        },
        media: _query,
        onchange: null,
        addEventListener: (_type: string, listener: () => void): void => {
            matchMediaListeners.add(listener);
        },
        removeEventListener: (_type: string, listener: () => void): void => {
            matchMediaListeners.delete(listener);
        },
        addListener: (_listener: () => void): void => {},
        removeListener: (_listener: () => void): void => {},
        dispatchEvent: (): boolean => false,
    })) as ReturnType<typeof vi.fn> & {
        __setMatches: (matches: boolean) => void;
    };
    matchMediaStub.__setMatches = (matches: boolean): void => {
        matchMediaMatches = matches;
        matchMediaListeners.forEach((listener): void => {
            listener({ matches });
        });
    };
    vi.stubGlobal('matchMedia', matchMediaStub);

    beforeEach((): void => {
        localStorageMock.clear();
        sessionStorageMock.clear();
    });

    afterEach((): void => {
        matchMediaListeners.clear();
        matchMediaMatches = false;
    });
}

vi.mock('idb-keyval', () => {
    const store = new Map<IDBValidKey, unknown>();
    return {
        get: vi.fn((key) => Promise.resolve(store.get(key))),
        set: vi.fn((key, value) => {
            store.set(key, value);
            return Promise.resolve();
        }),
        del: vi.fn((key) => {
            store.delete(key);
            return Promise.resolve();
        }),
        clear: vi.fn(() => {
            store.clear();
            return Promise.resolve();
        }),
    };
});

vi.mock('@marsidev/react-turnstile', () => ({
    Turnstile: ({ onSuccess }: { onSuccess?: (token: string) => void }) => {
        React.useEffect(() => {
            if (onSuccess) onSuccess('mock-turnstile-token');
        }, [onSuccess]);
        return React.createElement('div', { id: 'cf-turnstile' });
    },
}));
