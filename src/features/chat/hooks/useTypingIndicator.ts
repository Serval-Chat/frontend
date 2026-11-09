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
    hydrateTypingUsers: (
        users: { userId: string; username: string; expiresAt: string }[],
        currentUserId?: string,
    ) => void;
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

    const hydrateTypingUsers = useCallback(
        (
            users: { userId: string; username: string; expiresAt: string }[],
            currentUserId?: string,
        ): void => {
            const now = Date.now();
            const validUsers: TypingUser[] = [];

            for (const u of users) {
                if (u.userId === currentUserId) continue;
                const remainingMs = new Date(u.expiresAt).getTime() - now;
                if (remainingMs <= 0) continue;

                validUsers.push({ userId: u.userId, username: u.username });

                const existing = timeoutsRef.current!.get(u.userId);
                if (existing) globalThis.clearTimeout(existing);

                const uid = u.userId;
                const timeout = globalThis.setTimeout((): void => {
                    setTypingUsers((prev): TypingUser[] =>
                        prev.filter((t): boolean => t.userId !== uid),
                    );
                    timeoutsRef.current!.delete(uid);
                }, remainingMs);

                timeoutsRef.current!.set(u.userId, timeout);
            }

            if (validUsers.length === 0) return;

            setTypingUsers((prev): TypingUser[] => {
                const existingIds = new Set(prev.map((u) => u.userId));
                const newUsers = validUsers.filter(
                    (u): boolean => !existingIds.has(u.userId),
                );
                return newUsers.length > 0 ? [...prev, ...newUsers] : prev;
            });
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
        hydrateTypingUsers,
        clearTypingUsers,
    };
}
