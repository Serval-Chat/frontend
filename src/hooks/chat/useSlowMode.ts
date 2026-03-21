import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

import type { Channel } from '@/api/servers/servers.types';

/**
 * @description Hook to manage slow mode cooldown state and synchronization.
 */
export function useSlowMode(
    currentChannel: Channel | undefined,
    canBypassSlowMode: boolean,
): { cooldown: number; setCooldown: Dispatch<SetStateAction<number>> } {
    const [cooldown, setCooldown] = useState(0);

    const currentAllowedAt = canBypassSlowMode
        ? undefined
        : (currentChannel?.slowModeNextMessageAllowedAt ?? undefined);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        const update = (): void => {
            if (!currentAllowedAt) {
                setCooldown(0);
                return;
            }
            const nextAllowedAt = new Date(currentAllowedAt).getTime();
            const now = Date.now();
            const remaining = Math.ceil((nextAllowedAt - now) / 1000);
            setCooldown((prev) => {
                const newVal = remaining > 0 ? remaining : 0;
                return prev === newVal ? prev : newVal;
            });
        };

        // use setTimeout to avoid the "cascading render" lint error
        const timer = setTimeout(update, 0);

        if (currentAllowedAt) {
            interval = setInterval(update, 1000);
        }

        return () => {
            clearTimeout(timer);
            if (interval) clearInterval(interval);
        };
    }, [currentAllowedAt]);

    return { cooldown, setCooldown };
}
