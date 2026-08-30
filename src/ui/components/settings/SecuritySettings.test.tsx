import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';

import { SecuritySettings } from './SecuritySettings';

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn(),
}));

vi.mock('./ChangeLoginModal', () => ({
    ChangeLoginModal: () => null,
}));

vi.mock('./ChangePasswordModal', () => ({
    ChangePasswordModal: () => null,
}));

vi.mock('./TwoFactorSettings', () => ({
    TwoFactorSettings: () => null,
}));

vi.mock('./PasskeySettings', () => ({
    PasskeySettings: () => null,
}));

vi.mock('./PasswordlessSettings', () => ({
    PasswordlessSettings: () => null,
}));

const baseUser = {
    login: 'user@example.com',
    passwordless: false,
} as User;

describe('SecuritySettings', () => {
    it('shows both Change E-mail and Change Password for a normal account', () => {
        vi.mocked(useMe).mockReturnValue({ data: baseUser } as never);

        render(<SecuritySettings />);

        expect(
            screen.getByRole('button', { name: /Change E-mail/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Change Password/i }),
        ).toBeInTheDocument();
    });

    it('hides both Change E-mail and Change Password for a passwordless account, while still showing the e-mail address', () => {
        vi.mocked(useMe).mockReturnValue({
            data: { ...baseUser, passwordless: true },
        } as never);

        render(<SecuritySettings />);

        expect(
            screen.queryByRole('button', { name: /Change E-mail/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /Change Password/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByText(/us\*+@example\.com/)).toBeInTheDocument();
    });
});
