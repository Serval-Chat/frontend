import { fireEvent, render, screen } from '@testing-library/react';
import type { LexicalEditor } from 'lexical';
import { describe, expect, it, vi } from 'vitest';

import { MessageComposerActions } from './MessageComposerActions';

vi.mock('lexical', () => ({
    CLEAR_EDITOR_COMMAND: 'CLEAR_EDITOR_COMMAND',
}));

vi.mock('./lexical/lexicalUtils', () => ({
    $getRawMessageText: vi.fn((): string => ''),
}));

vi.mock('./GifPicker', () => ({
    GifPicker: (): React.ReactNode => <div>gif-picker-mock</div>,
}));

const baseProps = {
    editor: null as LexicalEditor | null,
    showEmojiPicker: false,
    showStickerPicker: false,
    showGifPicker: false,
    showPollModal: false,
    hasText: false,
    hasFiles: false,
    isMobile: false,
    isUploading: false,
    onToggleEmoji: vi.fn(),
    onToggleSticker: vi.fn(),
    onToggleGif: vi.fn(),
    onCloseGif: vi.fn(),
    onOpenPoll: vi.fn(),
    onSendMessage: vi.fn().mockResolvedValue(true),
};

const renderActions = (
    overrides: Partial<typeof baseProps> = {},
): ReturnType<typeof render> =>
    render(
        <MessageComposerActions
            editor={overrides.editor ?? baseProps.editor}
            hasFiles={overrides.hasFiles ?? baseProps.hasFiles}
            hasText={overrides.hasText ?? baseProps.hasText}
            isMobile={overrides.isMobile ?? baseProps.isMobile}
            isUploading={overrides.isUploading ?? baseProps.isUploading}
            showEmojiPicker={
                overrides.showEmojiPicker ?? baseProps.showEmojiPicker
            }
            showGifPicker={overrides.showGifPicker ?? baseProps.showGifPicker}
            showPollModal={overrides.showPollModal ?? baseProps.showPollModal}
            showStickerPicker={
                overrides.showStickerPicker ?? baseProps.showStickerPicker
            }
            onCloseGif={overrides.onCloseGif ?? baseProps.onCloseGif}
            onOpenPoll={overrides.onOpenPoll ?? baseProps.onOpenPoll}
            onSendMessage={overrides.onSendMessage ?? baseProps.onSendMessage}
            onToggleEmoji={overrides.onToggleEmoji ?? baseProps.onToggleEmoji}
            onToggleGif={overrides.onToggleGif ?? baseProps.onToggleGif}
            onToggleSticker={
                overrides.onToggleSticker ?? baseProps.onToggleSticker
            }
        />,
    );

const iconIn = (container: HTMLElement, iconClass: string): boolean =>
    container.querySelector(`.${iconClass}`) !== null;

describe('MessageComposerActions', (): void => {
    it('shows emoji, sticker, gif and poll buttons on desktop without content', (): void => {
        const { container } = renderActions();
        expect(iconIn(container, 'lucide-smile')).toBe(true);
        expect(iconIn(container, 'lucide-sticker')).toBe(true);
        expect(iconIn(container, 'lucide-file-image')).toBe(true);
        expect(iconIn(container, 'lucide-chart-no-axes-column')).toBe(true);
        expect(iconIn(container, 'lucide-send')).toBe(false);
        expect(screen.getAllByRole('button')).toHaveLength(4);
    });

    it('keeps all utility buttons on desktop when there is content', (): void => {
        const { container } = renderActions({ hasText: true });
        expect(iconIn(container, 'lucide-sticker')).toBe(true);
        expect(iconIn(container, 'lucide-file-image')).toBe(true);
        expect(iconIn(container, 'lucide-chart-no-axes-column')).toBe(true);
        expect(iconIn(container, 'lucide-send')).toBe(false);
        expect(screen.getAllByRole('button')).toHaveLength(4);
    });

    it('shows all utility buttons on mobile without content', (): void => {
        const { container } = renderActions({ isMobile: true });
        expect(iconIn(container, 'lucide-sticker')).toBe(true);
        expect(iconIn(container, 'lucide-file-image')).toBe(true);
        expect(iconIn(container, 'lucide-chart-no-axes-column')).toBe(true);
        expect(iconIn(container, 'lucide-send')).toBe(false);
        expect(screen.getAllByRole('button')).toHaveLength(4);
    });

    it('hides sticker, gif and poll buttons on mobile when there is text', (): void => {
        const { container } = renderActions({ isMobile: true, hasText: true });
        expect(iconIn(container, 'lucide-smile')).toBe(true);
        expect(iconIn(container, 'lucide-sticker')).toBe(false);
        expect(iconIn(container, 'lucide-file-image')).toBe(false);
        expect(iconIn(container, 'lucide-chart-no-axes-column')).toBe(false);
        expect(iconIn(container, 'lucide-send')).toBe(true);
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('hides sticker, gif and poll buttons on mobile when files are attached', (): void => {
        const { container } = renderActions({ isMobile: true, hasFiles: true });
        expect(iconIn(container, 'lucide-sticker')).toBe(false);
        expect(iconIn(container, 'lucide-file-image')).toBe(false);
        expect(iconIn(container, 'lucide-chart-no-axes-column')).toBe(false);
        expect(iconIn(container, 'lucide-send')).toBe(true);
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('does not render the gif picker on mobile with content even when it is open', async (): Promise<void> => {
        const { container } = renderActions({
            isMobile: true,
            hasText: true,
            showGifPicker: true,
        });
        expect(screen.queryByText('gif-picker-mock')).toBeNull();
        expect(iconIn(container, 'lucide-file-image')).toBe(false);
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('renders the gif picker on mobile without content', async (): Promise<void> => {
        const { container } = renderActions({
            isMobile: true,
            showGifPicker: true,
        });
        expect(await screen.findByText('gif-picker-mock')).toBeTruthy();
        expect(iconIn(container, 'lucide-file-image')).toBe(true);
    });

    const clickEmojiButton = (container: HTMLElement): void => {
        const button = container
            .querySelector('.lucide-smile')
            ?.closest('button');
        fireEvent.click(button!);
    };

    it('blurs the editor when the emoji button is toggled on mobile', (): void => {
        const blur = vi.fn();
        const { container } = renderActions({
            isMobile: true,
            editor: { blur } as unknown as LexicalEditor,
        });

        clickEmojiButton(container);
        expect(blur).toHaveBeenCalled();
    });

    it('does not blur the editor when the emoji button is toggled on desktop', (): void => {
        const blur = vi.fn();
        const { container } = renderActions({
            editor: { blur } as unknown as LexicalEditor,
        });

        clickEmojiButton(container);
        expect(blur).not.toHaveBeenCalled();
    });

    describe('toggle buttons do not leak mousedown to the document', (): void => {
        const getButton = (
            container: HTMLElement,
            iconClass: string,
        ): HTMLElement => {
            const button = container
                .querySelector(`.${iconClass}`)
                ?.closest('button');
            if (!button) throw new Error(`button for ${iconClass} not found`);
            return button;
        };

        it.each([
            ['emoji', 'lucide-smile'],
            ['sticker', 'lucide-sticker'],
            ['gif', 'lucide-file-image'],
        ])(
            'stops the %s button mousedown from reaching document listeners',
            (_name, iconClass): void => {
                const { container } = renderActions();
                const documentMouseDown = vi.fn();
                document.addEventListener('mousedown', documentMouseDown);

                fireEvent.mouseDown(getButton(container, iconClass));

                document.removeEventListener('mousedown', documentMouseDown);
                expect(documentMouseDown).not.toHaveBeenCalled();
            },
        );
    });
});
