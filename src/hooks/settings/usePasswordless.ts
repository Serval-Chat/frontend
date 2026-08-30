import { useReducer } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { startAuthentication } from '@simplewebauthn/browser';

import { passwordlessApi } from '@/api/passwordless/passwordless.api';
import { useToast } from '@/ui/components/common/Toast';
import { setAuthToken } from '@/utils/authToken';
import { extractApiError } from '@/utils/extractApiError';
import { mergeReducer } from '@/utils/mergeReducer';
import { isWebAuthnCancellation } from '@/utils/webauthn';

interface PasswordlessState {
    isEnabling: boolean;
    isRegenerating: boolean;
    recoveryKeys: string[] | null;
}

const initialState: PasswordlessState = {
    isEnabling: false,
    isRegenerating: false,
    recoveryKeys: null,
};

interface UsePasswordlessResult {
    isEnabling: boolean;
    isRegenerating: boolean;
    recoveryKeys: string[] | null;
    enable: (password: string) => Promise<void>;
    regenerateRecoveryKeys: () => Promise<void>;
    closeRecoveryKeysModal: () => void;
}

export const usePasswordless = (): UsePasswordlessResult => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [state, patch] = useReducer(
        mergeReducer<PasswordlessState>,
        initialState,
    );

    const enable = async (password: string): Promise<void> => {
        patch({ isEnabling: true });
        try {
            const data = await passwordlessApi.enable({ password });
            await setAuthToken(data.token);
            await queryClient.invalidateQueries({ queryKey: ['me'] });
            patch({ recoveryKeys: data.recoveryKeys });
        } catch (error) {
            showToast(
                extractApiError(error, 'Failed to enable passwordless sign-in.'),
                'error',
            );
        } finally {
            patch({ isEnabling: false });
        }
    };

    const regenerateRecoveryKeys = async (): Promise<void> => {
        patch({ isRegenerating: true });
        try {
            const { flowId, options } =
                await passwordlessApi.regenerateRecoveryKeysOptions();

            let credential;
            try {
                credential = await startAuthentication({ optionsJSON: options });
            } catch (error) {
                if (isWebAuthnCancellation(error)) return;
                throw error;
            }

            const data = await passwordlessApi.regenerateRecoveryKeysVerify({
                flowId,
                credential,
            });
            patch({ recoveryKeys: data.recoveryKeys });
        } catch (error) {
            showToast(
                extractApiError(error, 'Failed to regenerate recovery keys.'),
                'error',
            );
        } finally {
            patch({ isRegenerating: false });
        }
    };

    const closeRecoveryKeysModal = (): void => {
        patch({ recoveryKeys: null });
    };

    return {
        isEnabling: state.isEnabling,
        isRegenerating: state.isRegenerating,
        recoveryKeys: state.recoveryKeys,
        enable,
        regenerateRecoveryKeys,
        closeRecoveryKeysModal,
    };
};
