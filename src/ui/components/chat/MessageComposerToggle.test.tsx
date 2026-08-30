import React, { useRef, useState } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import type * as LexicalModule from 'lexical';
import { useClickAway } from 'react-use';
import { describe, expect, it, vi } from 'vitest';

import { MessageComposerActions } from './MessageComposerActions';
import { MessageComposerPickers } from './MessageComposerPickers';

vi.mock('./GifPicker', () => ({
    GifPicker: ({ onClose }: { onClose: () => void }): React.ReactNode => {
        const ref = useRef<HTMLDivElement>(null);
        useClickAway(ref, onClose);
        return <div ref={ref}>gif-picker-mock</div>;
    },
}));

vi.mock('@/ui/components/emoji/EmojiPicker', () => ({
    EmojiPicker: (): React.ReactNode => <div>emoji-picker-mock</div>,
}));

vi.mock('@/ui/components/emoji/StickerPicker', () => ({
    StickerPicker: (): React.ReactNode => <div>sticker-picker-mock</div>,
}));

vi.mock('@/hooks/useFrequentlyUsedEmojis', () => ({
    useFrequentlyUsedEmojis: () => ({
        quickReactions: [],
        frequentlyUsedCategory: null,
        recordUsage: vi.fn(),
    }),
}));

vi.mock('lexical', async (importOriginal) => {
    const actual = await importOriginal<typeof LexicalModule>();
    return {
        ...actual,
        CLEAR_EDITOR_COMMAND: 'CLEAR_EDITOR_COMMAND',
        $getSelection: vi.fn(() => null),
        $isRangeSelection: vi.fn(() => false),
    };
});

type Panel = 'emoji' | 'sticker' | 'gif' | null;

const ComposerHarness = (): React.ReactNode => {
    const [activePanel, setActivePanel] = useState<Panel>(null);
    const togglePanel = (panel: Exclude<Panel, null>): void => {
        setActivePanel((prev) => (prev === panel ? null : panel));
    };

    return (
        <>
            <MessageComposerActions
                editor={null}
                hasFiles={false}
                hasText={false}
                isMobile={false}
                isUploading={false}
                showEmojiPicker={activePanel === 'emoji'}
                showGifPicker={activePanel === 'gif'}
                showPollModal={false}
                showStickerPicker={activePanel === 'sticker'}
                onCloseGif={(): void => setActivePanel(null)}
                onOpenPoll={(): void => {}}
                onSendMessage={vi.fn().mockResolvedValue(true)}
                onToggleEmoji={(): void => togglePanel('emoji')}
                onToggleGif={(): void => togglePanel('gif')}
                onToggleSticker={(): void => togglePanel('sticker')}
            />
            <MessageComposerPickers
                customCategories={[]}
                editor={null}
                sendMessage={vi.fn()}
                showEmojiPicker={activePanel === 'emoji'}
                showStickerPicker={activePanel === 'sticker'}
                stickerCategories={[]}
                onClickAway={(): void => setActivePanel(null)}
                onStickerSelected={(): void => setActivePanel(null)}
            />
        </>
    );
};

const getToggleButton = (
    container: HTMLElement,
    iconClass: string,
): HTMLElement => {
    const button = container
        .querySelector(`.${iconClass}`)
        ?.closest('button');
    if (!button) throw new Error(`button for ${iconClass} not found`);
    return button;
};

const clickLikeBrowser = (el: HTMLElement): void => {
    fireEvent.mouseDown(el);
    fireEvent.mouseUp(el);
    fireEvent.click(el);
};

describe('composer toggle buttons (emoji, sticker, gif)', (): void => {
    it('opens the emoji picker on the first click and closes it on the second click', (): void => {
        const { container } = render(<ComposerHarness />);
        const button = getToggleButton(container, 'lucide-smile');

        clickLikeBrowser(button);
        expect(screen.getByText('emoji-picker-mock')).toBeTruthy();

        clickLikeBrowser(button);
        expect(screen.queryByText('emoji-picker-mock')).toBeNull();
    });

    it('opens the sticker picker on the first click and closes it on the second click', (): void => {
        const { container } = render(<ComposerHarness />);
        const button = getToggleButton(container, 'lucide-sticker');

        clickLikeBrowser(button);
        expect(screen.getByText('sticker-picker-mock')).toBeTruthy();

        clickLikeBrowser(button);
        expect(screen.queryByText('sticker-picker-mock')).toBeNull();
    });

    it('opens the gif picker on the first click and closes it on the second click', async (): Promise<void> => {
        const { container } = render(<ComposerHarness />);
        const button = getToggleButton(container, 'lucide-file-image');

        clickLikeBrowser(button);
        expect(await screen.findByText('gif-picker-mock')).toBeTruthy();

        clickLikeBrowser(button);
        expect(screen.queryByText('gif-picker-mock')).toBeNull();
    });

    it('switches from the emoji picker to the sticker picker in one click', (): void => {
        const { container } = render(<ComposerHarness />);
        const emojiButton = getToggleButton(container, 'lucide-smile');
        const stickerButton = getToggleButton(container, 'lucide-sticker');

        clickLikeBrowser(emojiButton);
        expect(screen.getByText('emoji-picker-mock')).toBeTruthy();

        clickLikeBrowser(stickerButton);
        expect(screen.queryByText('emoji-picker-mock')).toBeNull();
        expect(screen.getByText('sticker-picker-mock')).toBeTruthy();
    });
});
