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

    beforeEach((): void => {
        localStorageMock.clear();
        sessionStorageMock.clear();
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
