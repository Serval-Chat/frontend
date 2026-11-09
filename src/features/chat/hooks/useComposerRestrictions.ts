import { useEffect, useState } from 'react';

import type { Server, ServerMember } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { APP_LOCALE } from '@/utils/locale';

interface UseComposerRestrictionsArgs {
    me: User | undefined;
    serverDetails: Server | undefined;
    myMember: ServerMember | undefined;
}

/**
 * derives whether the composer must be locked because the member is timed out
 * (server communication disabled) or globally muted, plus a live-ticking clock
 * so the remaining time / expiry updates each second while a restriction lasts.
 */
export const useComposerRestrictions = ({
    me,
    serverDetails,
    myMember,
}: UseComposerRestrictionsArgs) => {
    const isOwner = serverDetails?.ownerId === me?.id;
    const timeoutUntil =
        myMember?.communicationDisabledUntil && !isOwner
            ? new Date(myMember.communicationDisabledUntil).getTime()
            : 0;
    const activeMute = me?.activeMute ?? null;
    const activeMuteExpiresAt = activeMute?.expirationTimestamp
        ? new Date(activeMute.expirationTimestamp)
        : null;
    const needsLiveClock =
        timeoutUntil > 0 ||
        (activeMute !== null && activeMuteExpiresAt !== null);

    const [now, setNow] = useState(() => Date.now());

    useEffect((): (() => void) | undefined => {
        if (!needsLiveClock) return;
        const update = (): void => {
            setNow(Date.now());
        };
        update();
        const interval = setInterval(update, 1000);
        return (): void => {
            clearInterval(interval);
        };
    }, [needsLiveClock]);

    const remainingTimeoutMs =
        timeoutUntil > 0 ? Math.max(0, timeoutUntil - now) : 0;
    const isTimedOut = remainingTimeoutMs > 0;
    const isGloballyMuted =
        activeMute !== null &&
        (activeMuteExpiresAt === null || activeMuteExpiresAt.getTime() > now);

    const formatMuteExpiry = (): string => {
        if (!activeMuteExpiresAt) return 'Permanent';
        return activeMuteExpiresAt.toLocaleString(APP_LOCALE);
    };

    return {
        isTimedOut,
        isGloballyMuted,
        remainingTimeoutMs,
        activeMute,
        formatMuteExpiry,
    };
};
