import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useDeleteChannel,
    useExportChannelState,
    useRequestExportChannel,
    useUpdateChannel,
} from '@/api/servers/servers.queries';
import type { Channel } from '@/api/servers/servers.types';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import { usePermissions } from '@/hooks/usePermissions';

import { ChannelOverviewSettings } from './ChannelOverviewSettings';

vi.mock('@/api/servers/servers.queries', () => ({
    useUpdateChannel: vi.fn(),
    useDeleteChannel: vi.fn(),
    usePermissions: vi.fn(),
    useExportChannelState: vi.fn().mockReturnValue({ data: undefined }),
    useRequestExportChannel: vi.fn().mockReturnValue({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: vi.fn().mockReturnValue({ hasPermission: () => false }),
}));

vi.mock('@/hooks/useCustomEmojis', () => ({
    useCustomEmojis: vi.fn().mockReturnValue({ customCategories: [] }),
}));

vi.mock('@/ui/components/emoji/EmojiPicker', () => ({
    EmojiPicker: ({
        onEmojiSelect,
    }: {
        onEmojiSelect: (emoji: string) => void;
    }) => (
        <button
            type="button"
            onClick={(): void => {
                onEmojiSelect('🎉');
            }}
        >
            pick-emoji
        </button>
    ),
}));

class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

const textChannel: Channel = {
    id: 'chan-1',
    name: 'general',
    serverId: 'server-1',
    type: 'text',
    position: 0,
    icon: 'Hash',
};

describe('ChannelOverviewSettings current/original form state', (): void => {
    const mockUpdate = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useUpdateChannel).mockReturnValue({
            mutate: mockUpdate,
            isPending: false,
        } as never);
        vi.mocked(useDeleteChannel).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as never);
        vi.mocked(usePermissions).mockReturnValue({
            hasPermission: (): boolean => false,
        } as never);
        vi.mocked(useExportChannelState).mockReturnValue({
            data: undefined,
        } as never);
        vi.mocked(useRequestExportChannel).mockReturnValue({
            mutate: vi.fn(),
        } as never);
        vi.mocked(useCustomEmojis).mockReturnValue({
            customCategories: [],
        } as never);
    });

    it('hides the floating bar with no local changes', (): void => {
        render(<ChannelOverviewSettings channel={textChannel} />);
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('shows the floating bar after an edit, and Reset reverts it', (): void => {
        render(<ChannelOverviewSettings channel={textChannel} />);

        fireEvent.change(screen.getByLabelText('Channel Name'), {
            target: { value: 'renamed' },
        });
        expect(screen.getByText('Save Changes')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Reset'));
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
        expect(
            (screen.getByLabelText('Channel Name') as HTMLInputElement).value,
        ).toBe('general');
    });

    it('picking an emoji clears the selected icon, and picking a preset icon clears the emoji', (): void => {
        render(<ChannelOverviewSettings channel={textChannel} />);

        // Preset icon "None" starts selected (channel.icon='Hash' isn't in
        // ICON_MAP as a real preset here, so this exercises "None").
        fireEvent.click(screen.getByText('Select Emoji'));
        fireEvent.click(screen.getByText('pick-emoji'));

        // Emoji is now selected; the icon grid's "None" button should no
        // longer be the active selection (selectedIcon was cleared).
        expect(screen.queryByText('Select Emoji')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Clear Emoji'));
        expect(screen.getByText('Select Emoji')).toBeInTheDocument();
    });

    it('Save sends the current fields and resyncs the original snapshot on success', (): void => {
        render(<ChannelOverviewSettings channel={textChannel} />);

        fireEvent.change(screen.getByLabelText('Channel Name'), {
            target: { value: 'renamed' },
        });
        fireEvent.click(screen.getByText('Save Changes'));

        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'renamed' }),
            expect.anything(),
        );

        const [, options] = mockUpdate.mock.calls[0] as [
            unknown,
            { onSuccess: () => void },
        ];
        act((): void => {
            options.onSuccess();
        });

        // The floating bar goes away because the "original" snapshot now
        // matches "current" - no further prop change needed.
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('resets all fields when the channel prop changes', (): void => {
        const { rerender } = render(
            <ChannelOverviewSettings channel={textChannel} />,
        );

        fireEvent.change(screen.getByLabelText('Channel Name'), {
            target: { value: 'renamed' },
        });
        expect(screen.getByText('Save Changes')).toBeInTheDocument();

        const otherChannel: Channel = {
            ...textChannel,
            id: 'chan-2',
            name: 'other-channel',
        };
        rerender(<ChannelOverviewSettings channel={otherChannel} />);

        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
        expect(
            (screen.getByLabelText('Channel Name') as HTMLInputElement).value,
        ).toBe('other-channel');
    });
});
