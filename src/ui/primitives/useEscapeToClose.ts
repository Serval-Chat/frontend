import { useEffect, useLayoutEffect, useRef } from 'react';

// Shared by every overlay in mount order so Escape only closes the topmost
// one, instead of every open overlay reacting to the same keypress.
let escapeStack: symbol[] = [];

export const useEscapeToClose = (
    isOpen: boolean,
    onClose: () => void,
): void => {
    const onCloseRef = useRef(onClose);
    useLayoutEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect((): (() => void) | undefined => {
        if (!isOpen) return undefined;

        const id = Symbol('overlay');
        escapeStack.push(id);

        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key === 'Escape' && escapeStack.at(-1) === id) {
                onCloseRef.current();
            }
        };
        globalThis.addEventListener('keydown', handleKeyDown);

        return (): void => {
            escapeStack = escapeStack.filter(
                (stackId): boolean => stackId !== id,
            );
            globalThis.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);
};
