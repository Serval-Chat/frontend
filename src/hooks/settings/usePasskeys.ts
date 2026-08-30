import { useReducer } from 'react';

import { startRegistration } from '@simplewebauthn/browser';
import { useQueryClient } from '@tanstack/react-query';

import { passkeyApi } from '@/api/passkey/passkey.api';
import { usePasskeysQuery } from '@/api/passkey/passkey.queries';
import type { PasskeyCredentialSummary } from '@/api/passkey/passkey.types';
import { useToast } from '@/ui/components/common/Toast';
import { extractApiError } from '@/utils/extractApiError';
import { mergeReducer } from '@/utils/mergeReducer';
import { isWebAuthnCancellation } from '@/utils/webauthn';

interface PasskeysState {
    isRegistering: boolean;
    mutatingId: string | null;
}

const initialState: PasskeysState = {
    isRegistering: false,
    mutatingId: null,
};

interface UsePasskeysResult {
    passkeys: PasskeyCredentialSummary[];
    isLoading: boolean;
    isRegistering: boolean;
    mutatingId: string | null;
    registerPasskey: (name?: string) => Promise<void>;
    renamePasskey: (id: string, name: string) => Promise<void>;
    removePasskey: (id: string) => Promise<void>;
}

export const usePasskeys = (): UsePasskeysResult => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const { data, isLoading } = usePasskeysQuery();
    const [state, patch] = useReducer(
        mergeReducer<PasskeysState>,
        initialState,
    );

    const invalidate = async (): Promise<void> => {
        await queryClient.invalidateQueries({ queryKey: ['passkeys'] });
    };

    const registerPasskey = async (name?: string): Promise<void> => {
        patch({ isRegistering: true });
        try {
            const { options } = await passkeyApi.registerOptions();

            let credential;
            try {
                credential = await startRegistration({ optionsJSON: options });
            } catch (error) {
                if (isWebAuthnCancellation(error)) return;
                throw error;
            }

            await passkeyApi.registerVerify({ credential, name });
            await invalidate();
            showToast('Passkey added.', 'success');
        } catch (error) {
            showToast(
                extractApiError(error, 'Failed to add passkey.'),
                'error',
            );
        } finally {
            patch({ isRegistering: false });
        }
    };

    const renamePasskey = async (id: string, name: string): Promise<void> => {
        patch({ mutatingId: id });
        try {
            await passkeyApi.rename(id, { name });
            await invalidate();
        } catch (error) {
            showToast(
                extractApiError(error, 'Failed to rename passkey.'),
                'error',
            );
        } finally {
            patch({ mutatingId: null });
        }
    };

    const removePasskey = async (id: string): Promise<void> => {
        patch({ mutatingId: id });
        try {
            await passkeyApi.remove(id);
            await invalidate();
            showToast('Passkey removed.', 'success');
        } catch (error) {
            showToast(
                extractApiError(error, 'Failed to remove passkey.'),
                'error',
            );
        } finally {
            patch({ mutatingId: null });
        }
    };

    return {
        passkeys: data?.passkeys ?? [],
        isLoading,
        isRegistering: state.isRegistering,
        mutatingId: state.mutatingId,
        registerPasskey,
        renamePasskey,
        removePasskey,
    };
};
