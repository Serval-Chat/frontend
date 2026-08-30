import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { hasAuthToken } from '@/utils/authToken';
import { isTauri } from '@/utils/tauri';

import { passkeyApi } from './passkey.api';
import type { PasskeyListResponse } from './passkey.types';

export const usePasskeysQuery = (): UseQueryResult<PasskeyListResponse> =>
    useQuery({
        queryKey: ['passkeys'],
        queryFn: passkeyApi.list,
        enabled: hasAuthToken() && !isTauri(),
    });
