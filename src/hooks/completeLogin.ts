import type { QueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';

import {
    checkAndMigrateVapid,
    listenForSwNavigation,
    setupWebPush,
} from '@/lib/pushClient';
import { setAuthToken } from '@/utils/authToken';

export const completeLogin = async (
    token: string,
    rememberMe: boolean,
    navigate: NavigateFunction,
    queryClient: QueryClient,
): Promise<void> => {
    await setAuthToken(token, rememberMe);
    await queryClient.invalidateQueries({ queryKey: ['me'] });

    await setupWebPush();
    await checkAndMigrateVapid();
    listenForSwNavigation((url): void => {
        void navigate(url);
    });

    void navigate('/chat/@me');
};
