import { useState } from 'react';

import { useToast } from '@/ui/components/common/Toast';
import type { InviteActionState } from '@/ui/components/servers/InviteActionButton';

interface UseInviteActionStatesResult {
    states: Record<string, InviteActionState>;
    send: (key: string, action: () => Promise<void>) => Promise<void>;
    reset: () => void;
}

export const useInviteActionStates = (): UseInviteActionStatesResult => {
    const { showToast } = useToast();
    const [states, setStates] = useState<Record<string, InviteActionState>>({});

    const send = async (
        key: string,
        action: () => Promise<void>,
    ): Promise<void> => {
        setStates((prev) => ({ ...prev, [key]: 'pending' }));
        try {
            await action();
            setStates((prev) => ({ ...prev, [key]: 'sent' }));
        } catch {
            setStates((prev) => ({ ...prev, [key]: 'idle' }));
            showToast('Failed to send invite.', 'error');
        }
    };

    const reset = (): void => setStates({});

    return { states, send, reset };
};
