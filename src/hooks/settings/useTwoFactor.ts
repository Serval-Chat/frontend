import { useReducer } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';

import { authApi } from '@/api/auth/auth.api';
import { useToast } from '@/ui/components/common/Toast';
import { mergeReducer } from '@/utils/mergeReducer';

interface TwoFactorState {
    isLoading: boolean;
    isConfirmLoading: boolean;
    isBackupModalOpen: boolean;
    setupUri: string;
    qrDataUrl: string;
    code: string;
    backupCode: string;
    showDisableBackupInput: boolean;
    backupCodes: string[];
}

const initialState: TwoFactorState = {
    isLoading: false,
    isConfirmLoading: false,
    isBackupModalOpen: false,
    setupUri: '',
    qrDataUrl: '',
    code: '',
    backupCode: '',
    showDisableBackupInput: false,
    backupCodes: [],
};

/**
 * encapsulates the full two-factor-authentication flow (setup, confirm,
 * regenerate backup codes, disable) plus its transient UI state. Extracted
 * from AccountSettings so the view layer stays presentational.
 */
export const useTwoFactor = () => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [state, patch] = useReducer(
        mergeReducer<TwoFactorState>,
        initialState,
    );

    const setCode = (code: string): void => {
        patch({ code: code.replaceAll(/\D/g, '') });
    };

    const setBackupCode = (backupCode: string): void => {
        patch({ backupCode: backupCode.toUpperCase().replaceAll(/\s+/g, '') });
    };

    const toggleDisableBackupInput = (): void => {
        patch((s) => ({ showDisableBackupInput: !s.showDisableBackupInput }));
    };

    const closeBackupModal = (): void => {
        patch({ isBackupModalOpen: false, backupCodes: [] });
    };

    const startSetup = async (): Promise<void> => {
        patch({ isLoading: true });
        try {
            const data = await authApi.setupTwoFactor();
            const dataUrl = await QRCode.toDataURL(data.otpauthUri, {
                width: 220,
                margin: 1,
            });
            patch({
                setupUri: data.otpauthUri,
                qrDataUrl: dataUrl,
                code: '',
            });
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to start 2FA setup';
            showToast(message, 'error');
        } finally {
            patch({ isLoading: false });
        }
    };

    const confirmSetup = async (): Promise<void> => {
        if (!state.code.trim()) {
            showToast(
                'Enter the 6-digit code from your authenticator app.',
                'error',
            );
            return;
        }
        patch({ isConfirmLoading: true });
        try {
            const data = await authApi.confirmTwoFactorSetup({
                code: state.code.trim(),
            });
            patch({
                backupCodes: data.backupCodes,
                isBackupModalOpen: true,
                setupUri: '',
                qrDataUrl: '',
                code: '',
            });
            await queryClient.invalidateQueries({ queryKey: ['me'] });
            showToast('Two-factor authentication enabled.', 'success');
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Invalid authentication code';
            showToast(message, 'error');
        } finally {
            patch({ isConfirmLoading: false });
        }
    };

    const regenerateBackupCodes = async (): Promise<void> => {
        if (!state.code.trim()) {
            showToast(
                'Enter a valid authenticator code to regenerate backup codes.',
                'error',
            );
            return;
        }
        patch({ isConfirmLoading: true });
        try {
            const data = await authApi.regenerateBackupCodes({
                code: state.code.trim(),
            });
            patch({
                backupCodes: data.backupCodes,
                isBackupModalOpen: true,
                code: '',
            });
            showToast('Backup codes regenerated.', 'success');
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to regenerate backup codes';
            showToast(message, 'error');
        } finally {
            patch({ isConfirmLoading: false });
        }
    };

    const disable = async (): Promise<void> => {
        const payload = state.showDisableBackupInput
            ? { backupCode: state.backupCode.trim() }
            : { code: state.code.trim() };
        if (
            (!state.showDisableBackupInput && !state.code.trim()) ||
            (state.showDisableBackupInput && !state.backupCode.trim())
        ) {
            showToast(
                'Provide a valid authentication code to disable 2FA.',
                'error',
            );
            return;
        }
        patch({ isConfirmLoading: true });
        try {
            await authApi.disableTwoFactor(payload);
            patch({
                code: '',
                backupCode: '',
                showDisableBackupInput: false,
            });
            await queryClient.invalidateQueries({ queryKey: ['me'] });
            showToast('Two-factor authentication disabled.', 'success');
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to disable two-factor authentication';
            showToast(message, 'error');
        } finally {
            patch({ isConfirmLoading: false });
        }
    };

    return {
        ...state,
        setCode,
        setBackupCode,
        toggleDisableBackupInput,
        closeBackupModal,
        startSetup,
        confirmSetup,
        regenerateBackupCodes,
        disable,
    };
};
