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

    const addTypingUser = useCallback((userId: string, username: string) => {
        setTypingUsers((prev) => {
            // Don't add if already typing
            if (prev.some((u) => u.userId === userId)) {
                return prev;
            }
            return [...prev, { userId, username }];
        });

        // Clear existing timeout for this user
        const existingTimeout = timeoutsRef.current.get(userId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Remove user after 3 seconds of inactivity
        const timeout = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
            timeoutsRef.current.delete(userId);
        }, 3000);

        timeoutsRef.current.set(userId, timeout);
    }, []);

    const clearTypingUsers = useCallback(() => {
        setTypingUsers([]);
        timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        timeoutsRef.current.clear();
    }, []);

    useEffect(() => {
        const timeouts = timeoutsRef.current;
        return () => {
            // Cleanup all timeouts on unmount
            timeouts.forEach((timeout) => clearTimeout(timeout));
        };
    }, []);

    return {
        typingUsers,
        addTypingUser,
        clearTypingUsers,
    };
}
