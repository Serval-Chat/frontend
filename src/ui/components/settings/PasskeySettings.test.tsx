import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePasskeys } from '@/hooks/settings/usePasskeys';
import { canUsePasskeys } from '@/utils/webauthn';

import { PasskeySettings } from './PasskeySettings';

vi.mock('@/hooks/settings/usePasskeys', () => ({
    usePasskeys: vi.fn(),
}));

vi.mock('@/utils/webauthn', () => ({
    canUsePasskeys: vi.fn(),
}));

const baseHook = {
    passkeys: [],
    isLoading: false,
    isRegistering: false,
    mutatingId: null,
    registerPasskey: vi.fn(),
    renamePasskey: vi.fn(),
    removePasskey: vi.fn(),
};

describe('PasskeySettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(usePasskeys).mockReturnValue(baseHook as never);
    });

    it('renders null when passkeys are unsupported', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(false);
        const { container } = render(<PasskeySettings />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the credential list from usePasskeys', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        vi.mocked(usePasskeys).mockReturnValue({
            ...baseHook,
            passkeys: [
                {
                    id: 'pk-1',
                    name: 'MacBook',
                    deviceType: 'singleDevice',
                    createdAt: new Date().toISOString(),
                    lastUsedAt: null,
                },
            ],
        } as never);

        render(<PasskeySettings />);
        expect(screen.getByText('MacBook')).toBeInTheDocument();
    });

    it('add passkey modal calls registerPasskey with the entered name', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        const registerPasskey = vi.fn().mockResolvedValue(undefined);
        vi.mocked(usePasskeys).mockReturnValue({
            ...baseHook,
            registerPasskey,
        } as never);

        render(<PasskeySettings />);
        fireEvent.click(screen.getByRole('button', { name: /Add Passkey/i }));
        fireEvent.change(screen.getByPlaceholderText(/MacBook Touch ID/i), {
            target: { value: 'My Key' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        expect(registerPasskey).toHaveBeenCalledWith('My Key');
    });

    it('delete button calls removePasskey with the credential id', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        const removePasskey = vi.fn().mockResolvedValue(undefined);
        vi.mocked(usePasskeys).mockReturnValue({
            ...baseHook,
            passkeys: [
                {
                    id: 'pk-1',
                    name: 'MacBook',
                    deviceType: 'singleDevice',
                    createdAt: new Date().toISOString(),
                    lastUsedAt: null,
                },
            ],
            removePasskey,
        } as never);

        render(<PasskeySettings />);
        fireEvent.click(screen.getByRole('button', { name: /Remove/i }));

        expect(removePasskey).toHaveBeenCalledWith('pk-1');
    });
});
