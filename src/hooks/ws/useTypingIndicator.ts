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
    const timeoutsRef = useRef<Map<string, number>>(new Map());

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
            const existingTimeout = timeoutsRef.current.get(userId);
            if (existingTimeout) {
                window.clearTimeout(existingTimeout);
            }

            // Remove user after 3 seconds of inactivity
            const timeout = window.setTimeout((): void => {
                setTypingUsers((prev): TypingUser[] =>
                    prev.filter((u): boolean => u.userId !== userId),
                );
                timeoutsRef.current.delete(userId);
            }, 3000);

            timeoutsRef.current.set(userId, timeout);
        },
        [],
    );

    const clearTypingUsers = useCallback((): void => {
        setTypingUsers([]);
        timeoutsRef.current.forEach((timeout): void =>
            window.clearTimeout(timeout),
        );
        timeoutsRef.current.clear();
    }, []);

    useEffect((): (() => void) => {
        const timeouts = timeoutsRef.current;
        return (): void => {
            // Cleanup all timeouts on unmount
            timeouts.forEach((timeout): void => window.clearTimeout(timeout));
        };
    }, []);

    return {
        typingUsers,
        addTypingUser,
        clearTypingUsers,
    };
}
