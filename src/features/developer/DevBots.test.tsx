import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBots } from '@/hooks/developer/useBots';
import type { Bot } from '@/types/bot';

import { DevBots } from './DevBots';

vi.mock('@/hooks/developer/useBots', () => ({
    useBots: vi.fn(),
}));

const makeBot = (clientId: string, displayName: string): Bot =>
    ({
        clientId,
        user: { displayName, username: displayName.toLowerCase() },
        userId: '1234567890',
    }) as unknown as Bot;

const setBots = (
    data: Bot[] | undefined,
    isLoading: boolean,
    isError = false,
): void => {
    vi.mocked(useBots).mockReturnValue({
        data,
        isError,
        isLoading,
    } as unknown as ReturnType<typeof useBots>);
};

describe('DevBots', (): void => {
    const onCreateBot = vi.fn();
    const onViewBot = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
    });

    it('hides the registered count while the list is loading', (): void => {
        setBots(undefined, true);

        render(<DevBots onCreateBot={onCreateBot} onViewBot={onViewBot} />);

        expect(screen.queryByText(/registered/)).toBeNull();
    });

    it('shows the count once the list has loaded', (): void => {
        setBots([], false);

        render(<DevBots onCreateBot={onCreateBot} onViewBot={onViewBot} />);

        expect(screen.getByText('0 bots registered')).toBeInTheDocument();
    });

    it('pluralizes the count for a single bot', (): void => {
        setBots([makeBot('111', 'Helper Bot')], false);

        render(<DevBots onCreateBot={onCreateBot} onViewBot={onViewBot} />);

        expect(screen.getByText('1 bot registered')).toBeInTheDocument();
    });

    it('offers a New Bot action from the empty state', (): void => {
        setBots([], false);

        render(<DevBots onCreateBot={onCreateBot} onViewBot={onViewBot} />);

        fireEvent.click(screen.getByRole('button', { name: /New Bot/ }));

        expect(onCreateBot).toHaveBeenCalledTimes(1);
        expect(onViewBot).not.toHaveBeenCalled();
    });

    it('does not offer the New Bot action when bots exist', (): void => {
        setBots([makeBot('111', 'Helper Bot')], false);

        render(<DevBots onCreateBot={onCreateBot} onViewBot={onViewBot} />);

        expect(screen.queryByRole('button', { name: /New Bot/ })).toBeNull();
    });

    it('shows the refresh hint with the failure message', (): void => {
        setBots(undefined, false, true);

        render(<DevBots onCreateBot={onCreateBot} onViewBot={onViewBot} />);

        expect(
            screen.getByText('Refresh the page to try again.'),
        ).toBeInTheDocument();
    });

    it('keeps the failure message when a refetch is also in flight', (): void => {
        setBots(undefined, true, true);

        const { container } = render(
            <DevBots onCreateBot={onCreateBot} onViewBot={onViewBot} />,
        );

        expect(screen.getByText("Couldn't load your bots")).toBeInTheDocument();
        expect(container.querySelector('.animate-pulse')).toBeNull();
        expect(screen.queryByText(/registered/)).toBeNull();
    });

    it('renders the count alongside a populated grid', (): void => {
        setBots(
            [makeBot('111', 'Helper Bot'), makeBot('222', 'Other Bot')],
            false,
        );

        render(<DevBots onCreateBot={onCreateBot} onViewBot={onViewBot} />);

        expect(screen.getByText('2 bots registered')).toBeInTheDocument();
        expect(screen.getByText('Helper Bot')).toBeInTheDocument();
        expect(screen.getByText('Other Bot')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Manage/ })).toHaveLength(
            2,
        );
    });

    it('shows an error instead of a zero count when the list fails to load', (): void => {
        setBots(undefined, false, true);

        render(<DevBots onCreateBot={onCreateBot} onViewBot={onViewBot} />);

        expect(screen.getByText("Couldn't load your bots")).toBeInTheDocument();
        expect(screen.queryByText(/registered/)).toBeNull();
        expect(
            screen.queryByText('Create your first bot to get started.'),
        ).toBeNull();
        expect(screen.queryByRole('button', { name: /New Bot/ })).toBeNull();
    });
});
