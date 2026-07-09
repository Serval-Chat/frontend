import type { LexicalEditor } from 'lexical';

import type { OutgoingPoll } from '@/api/chat/chat.types';
import type { CustomEmojiCategory } from '@/ui/components/emoji/EmojiPicker';
import type { StickerCategory } from '@/ui/components/emoji/StickerPicker';
import { Box } from '@/ui/components/layout/Box';

import { CreatePollModal } from './CreatePollModal';
import { MessageComposerPickers } from './MessageComposerPickers';
import type { SlashPreview } from './messageInputSlashPreview';

interface MessageComposerOverlaysProps {
    editor: LexicalEditor | null;
    showEmojiPicker: boolean;
    showStickerPicker: boolean;
    customCategories: CustomEmojiCategory[];
    stickerCategories: StickerCategory[];
    sendMessage: (text: string, replyToId?: string, stickerId?: string) => void;
    slashPreview: SlashPreview | null;
    showPollModal: boolean;
    onClosePanels: () => void;
    onClosePoll: () => void;
    onSubmitPoll: (poll: OutgoingPoll) => void;
}

export const MessageComposerOverlays = ({
    editor,
    showEmojiPicker,
    showStickerPicker,
    customCategories,
    stickerCategories,
    sendMessage,
    slashPreview,
    showPollModal,
    onClosePanels,
    onClosePoll,
    onSubmitPoll,
}: MessageComposerOverlaysProps): React.ReactNode => (
    <>
        <MessageComposerPickers
            customCategories={customCategories}
            editor={editor}
            sendMessage={sendMessage}
            showEmojiPicker={showEmojiPicker}
            showStickerPicker={showStickerPicker}
            stickerCategories={stickerCategories}
            onClickAway={onClosePanels}
            onStickerSelected={onClosePanels}
        />

        {slashPreview ? (
            <Box className="border-t border-border-subtle px-3 py-1.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                    /{slashPreview.commandName}
                </span>
                <span className="ml-2">{slashPreview.status}</span>
                {slashPreview.usage ? (
                    <span className="ml-2 opacity-80">
                        Usage: {slashPreview.usage}
                    </span>
                ) : null}
            </Box>
        ) : null}

        <CreatePollModal
            isOpen={showPollModal}
            onClose={onClosePoll}
            onSubmit={onSubmitPoll}
        />
    </>
);
