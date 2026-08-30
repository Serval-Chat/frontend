import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@/api/users/users.types';
import { usePasswordless } from '@/hooks/settings/usePasswordless';
import { canUsePasskeys } from '@/utils/webauthn';

import { PasswordlessSettings } from './PasswordlessSettings';

vi.mock('@/hooks/settings/usePasswordless', () => ({
    usePasswordless: vi.fn(),
}));

vi.mock('@/utils/webauthn', () => ({
    canUsePasskeys: vi.fn(),
}));

const baseHook = {
    isEnabling: false,
    isRegenerating: false,
    recoveryKeys: null,
    enable: vi.fn(),
    regenerateRecoveryKeys: vi.fn(),
    closeRecoveryKeysModal: vi.fn(),
};

const baseUser = { passwordless: false } as User;

describe('PasswordlessSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(usePasswordless).mockReturnValue(baseHook as never);
    });

    it('renders null when passkeys are unsupported', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(false);
        const { container } = render(<PasswordlessSettings user={baseUser} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows "Go Passwordless" for a normal account', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        render(<PasswordlessSettings user={baseUser} />);
        expect(
            screen.getByRole('button', { name: /Go Passwordless/i }),
        ).toBeInTheDocument();
    });

    it('shows "Regenerate Recovery Keys" for a passwordless account', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        render(<PasswordlessSettings user={{ passwordless: true } as User} />);
        expect(
            screen.getByRole('button', {
                name: /Regenerate Recovery Keys/i,
            }),
        ).toBeInTheDocument();
    });

    it('confirming the modal calls enable with the entered password', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        const enable = vi.fn().mockResolvedValue(undefined);
        vi.mocked(usePasswordless).mockReturnValue({
            ...baseHook,
            enable,
        } as never);

        render(<PasswordlessSettings user={baseUser} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Go Passwordless/i }),
        );
        fireEvent.change(screen.getByPlaceholderText('Current password'), {
            target: { value: 'my-current-password' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

        expect(enable).toHaveBeenCalledWith('my-current-password');
    });

    it('clicking regenerate calls regenerateRecoveryKeys', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        const regenerateRecoveryKeys = vi.fn().mockResolvedValue(undefined);
        vi.mocked(usePasswordless).mockReturnValue({
            ...baseHook,
            regenerateRecoveryKeys,
        } as never);

        render(<PasswordlessSettings user={{ passwordless: true } as User} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Regenerate Recovery Keys/i }),
        );

        expect(regenerateRecoveryKeys).toHaveBeenCalled();
    });

    it('shows the revealed recovery keys when present', () => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        vi.mocked(usePasswordless).mockReturnValue({
            ...baseHook,
            recoveryKeys: ['CODE-0001', 'CODE-0002'],
        } as never);

        render(<PasswordlessSettings user={baseUser} />);

        expect(screen.getByText('CODE-0001')).toBeInTheDocument();
        expect(screen.getByText('CODE-0002')).toBeInTheDocument();
    });
});
