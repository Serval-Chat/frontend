import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

const createStorageMock = () => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() {
            return Object.keys(store).length;
        },
    };
};

if (typeof window !== 'undefined') {
    const localStorageMock = createStorageMock();
    const sessionStorageMock = createStorageMock();

    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('sessionStorage', sessionStorageMock);

    beforeEach(() => {
        localStorageMock.clear();
        sessionStorageMock.clear();
    });
}
