import React, { useState } from 'react';

import { useChatWS } from '@/hooks/ws/useChatWS';
import { useAppSelector } from '@/store/hooks';
import { TextArea } from '@/ui/components/common/TextArea';
import { Box } from '@/ui/components/layout/Box';

/**
 * @description Input component for sending messages in the chat.
 */
export const MessageInput: React.FC = () => {
    const [value, setValue] = useState('');

    const selectedFriendId = useAppSelector(
        (state) => state.nav.selectedFriendId
    );
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId
    );
    const selectedChannelId = useAppSelector(
        (state) => state.nav.selectedChannelId
    );

    const { sendMessage, sendTyping } = useChatWS(
        selectedFriendId ?? undefined,
        selectedServerId ?? undefined,
        selectedChannelId ?? undefined
    );

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>
    ): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            if (value.trim()) {
                sendMessage(value.trim());
                setValue('');
            }
        }
    };

    return (
        <Box className="py-1 px-1">
            <TextArea
                className="w-full bg-[var(--bg-msg-input)]"
                placeholder="Type a message..."
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    sendTyping();
                }}
                onKeyDown={handleKeyDown}
            />
        </Box>
    );
};
