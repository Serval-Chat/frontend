import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { serversApi } from '@/api/servers/servers.api';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';

import { CreateChannelModal } from './CreateChannelModal';

vi.mock('@/hooks/useCustomEmojis', () => ({
    useCustomEmojis: vi.fn().mockReturnValue({ customCategories: [] }),
}));

vi.mock('@/api/servers/servers.api', () => ({
    serversApi: {
        createChannel: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/ui/components/emoji/EmojiPicker', () => {
    const EmojiPicker = ({
        onEmojiSelect,
    }: {
        onEmojiSelect: (emoji: string) => void;
    }) => (
        <button
            type="button"
            onClick={(): void => {
                onEmojiSelect('😀');
            }}
        >
            pick-emoji
        </button>
    );
    return { EmojiPicker };
});

// jsdom doesn't implement ResizeObserver; Popover's positioning hook needs it.
class ResizeObserverStub {
    observe(): void {
        // no-op stub
    }
    unobserve(): void {
        // no-op stub
    }
    disconnect(): void {
        // no-op stub
    }
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

describe('CreateChannelModal form state', (): void => {
    const onClose = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useCustomEmojis).mockReturnValue({
            customCategories: [],
        } as never);
    });

    function renderModal(): ReturnType<typeof render> {
        return render(
            <CreateChannelModal isOpen serverId="server-1" onClose={onClose} />,
        );
    }

    it('disables Create until a name is entered', (): void => {
        renderModal();
        expect(
            screen.getByRole('button', { name: 'Create Channel' }),
        ).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('new-channel'), {
            target: { value: 'general' },
        });
        expect(
            screen.getByRole('button', { name: 'Create Channel' }),
        ).not.toBeDisabled();
    });

    it('requires a valid URL for Link channels before creating', async (): Promise<void> => {
        renderModal();

        const nameInput = screen.getByPlaceholderText('new-channel');
        fireEvent.change(nameInput, { target: { value: 'my-link' } });
        fireEvent.click(screen.getByText('Link'));

        // The Create button is legitimately disabled while the URL is empty;
        // this path is only reachable via Enter in the name field, which
        // doesn't share that guard.
        expect(
            screen.getByRole('button', { name: 'Create Channel' }),
        ).toBeDisabled();
        fireEvent.keyDown(nameInput, { key: 'Enter' });

        expect(
            await screen.findByText('URL is required for Link channels.'),
        ).toBeInTheDocument();
        expect(serversApi.createChannel).not.toHaveBeenCalled();

        fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
            target: { value: 'not-a-url' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Create Channel' }));

        expect(
            await screen.findByText(
                'Please enter a valid URL (e.g., https://example.com).',
            ),
        ).toBeInTheDocument();
        expect(serversApi.createChannel).not.toHaveBeenCalled();
    });

    it('creates the channel with the selected emoji and closes on success', async (): Promise<void> => {
        renderModal();

        fireEvent.change(screen.getByPlaceholderText('new-channel'), {
            target: { value: 'general' },
        });
        fireEvent.click(screen.getByText('Select'));
        fireEvent.click(screen.getByText('pick-emoji'));
        fireEvent.click(screen.getByRole('button', { name: 'Create Channel' }));

        await vi.waitFor((): void => {
            expect(serversApi.createChannel).toHaveBeenCalledWith('server-1', {
                name: 'general',
                categoryId: undefined,
                type: 'text',
                emoji: '😀',
                emojiType: 'unicode',
            });
        });
        expect(onClose).toHaveBeenCalled();
    });

    it('clears all form fields (name, type, url, emoji, error) when cancelled', async (): Promise<void> => {
        renderModal();

        fireEvent.change(screen.getByPlaceholderText('new-channel'), {
            target: { value: 'general' },
        });
        fireEvent.click(screen.getByText('Link'));
        fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
            target: { value: 'not-a-url' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Create Channel' }));
        expect(
            await screen.findByText(
                'Please enter a valid URL (e.g., https://example.com).',
            ),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancel'));

        expect(onClose).toHaveBeenCalled();
        expect(
            (screen.getByPlaceholderText('new-channel') as HTMLInputElement)
                .value,
        ).toBe('');
        // Reverted to the default channel type, so the URL field is gone again.
        expect(
            screen.queryByPlaceholderText('https://example.com'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText(
                'Please enter a valid URL (e.g., https://example.com).',
            ),
        ).not.toBeInTheDocument();
    });
});
