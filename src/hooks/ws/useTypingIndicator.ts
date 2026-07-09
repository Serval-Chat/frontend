import { useCallback, useEffect, useRef, useState } from 'react';

export interface TypingUser {
    userId: string;
    username: string;
}

/**
 * @description Hook for managing typing indicator state
 */
export function useTypingIndicator(): {
    typingUsers: TypingUser[];
    addTypingUser: (userId: string, username: string) => void;
    clearTypingUsers: () => void;
} {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const timeoutsRef = useRef<Map<
        string,
        ReturnType<typeof setTimeout>
    > | null>(null);
    if (timeoutsRef.current === null) timeoutsRef.current = new Map();

    const addTypingUser = useCallback(
        (userId: string, username: string): void => {
            setTypingUsers((prev): TypingUser[] => {
                // Don't add if already typing
                if (prev.some((u): boolean => u.userId === userId)) {
                    return prev;
                }
                return [...prev, { userId, username }];
            });

            // Clear existing timeout for this user
            const existingTimeout = timeoutsRef.current!.get(userId);
            if (existingTimeout) {
                globalThis.clearTimeout(existingTimeout);
            }

            // Remove user after 3 seconds of inactivity
            const timeout = globalThis.setTimeout((): void => {
                setTypingUsers((prev): TypingUser[] =>
                    prev.filter((u): boolean => u.userId !== userId),
                );
                timeoutsRef.current!.delete(userId);
            }, 3000);

            timeoutsRef.current!.set(userId, timeout);
        },
        [],
    );

    const clearTypingUsers = useCallback((): void => {
        setTypingUsers([]);
        for (const timeout of timeoutsRef.current!.values())
            globalThis.clearTimeout(timeout);
        timeoutsRef.current!.clear();
    }, []);

    useEffect((): (() => void) => {
        const timeouts = timeoutsRef.current!;
        return (): void => {
            // Cleanup all timeouts on unmount
            for (const timeout of timeouts.values())
                globalThis.clearTimeout(timeout);
        };
    }, []);

    return {
        typingUsers,
        addTypingUser,
        clearTypingUsers,
    };
}
