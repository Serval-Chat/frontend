import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    type UserPresenceMode,
    updatePresenceStatus,
} from '@/store/slices/presenceSlice';
import { wsMessages } from '@/ws/messages';

export type ManualUserStatus = UserPresenceMode;

export const useSelfStatus = (): {
    status: ManualUserStatus;
    setStatus: (status: ManualUserStatus) => void;
} => {
    const { data: user } = useMe();
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();

    const livePresenceStatus = useAppSelector(
        (state) => state.presence.users[user?.id ?? '']?.presenceStatus,
    );

    const setStatus = useCallback(
        (status: ManualUserStatus): void => {
            if (!user) return;

            dispatch(
                updatePresenceStatus({
                    userId: user.id,
                    presenceStatus: status,
                }),
            );
            queryClient.setQueryData<User>(['me'], (old) =>
                old ? { ...old, presenceStatus: status } : old,
            );
            wsMessages.setPresenceStatus(status);
        },
        [dispatch, queryClient, user],
    );

    return {
        status: livePresenceStatus ?? user?.presenceStatus ?? 'online',
        setStatus,
    };
};
