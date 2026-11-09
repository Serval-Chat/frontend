import { useSyncExternalStore } from 'react';

let loaded = false;
let started = false;
const listeners = new Set<() => void>();

const markLoaded = (): void => {
    loaded = true;
    listeners.forEach((listener) => {
        listener();
    });
};

const start = (): void => {
    if (started || typeof Image === 'undefined') return;
    started = true;
    const img = new Image();
    img.onload = markLoaded;
    img.onerror = markLoaded;
    img.src = '/emoji-sheet.webp';
};

const subscribe = (listener: () => void): (() => void) => {
    start();
    listeners.add(listener);
    return (): void => {
        listeners.delete(listener);
    };
};

export const useEmojiSheetLoaded = (): boolean =>
    useSyncExternalStore(
        subscribe,
        () => loaded,
        () => true,
    );
