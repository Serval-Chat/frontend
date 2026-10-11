import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { censorToken } from '@/utils/censorToken';

import { DeveloperSettings } from './DeveloperSettings';

const dispatch = vi.fn();

vi.mock('@/store/hooks', () => ({
    useAppDispatch: (): typeof dispatch => dispatch,
    useAppSelector: (): boolean => false,
}));

vi.mock('@/ws/debug', () => ({
    toggleWsDebugWindow: vi.fn(),
    useWsDebugWindowOpen: (): boolean => false,
}));

vi.mock('@sentry/react', () => ({
    captureException: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
}));

const TOKEN = 'serchat_ABCD1234567890abcd';

describe('DeveloperSettings - user token row', (): void => {
    const writeText = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();

        writeText.mockReset();
        writeText.mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });
    });

    it('shows the token censored but copies the full token', async (): Promise<void> => {
        localStorage.setItem('auth_token', TOKEN);

        render(<DeveloperSettings />);

        const input = screen.getByLabelText('User token (censored)');
        expect(input).toHaveValue(censorToken(TOKEN));
        expect(input).not.toHaveValue(TOKEN);

        fireEvent.click(screen.getByRole('button', { name: 'Copy token' }));
        await act(async (): Promise<void> => undefined);

        expect(writeText).toHaveBeenCalledWith(TOKEN);
    });

    it('renders no copy button and shows a placeholder when there is no token', (): void => {
        render(<DeveloperSettings />);

        expect(screen.getByDisplayValue('-')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Copy token' })).toBeNull();
        expect(writeText).not.toHaveBeenCalled();
    });
});
