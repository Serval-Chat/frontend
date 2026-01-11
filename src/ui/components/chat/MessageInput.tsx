import React, { useState } from 'react';

import { useChatWS } from '@/hooks/ws/useChatWS';
import { useAppSelector } from '@/store/hooks';
import { Input } from '@/ui/components/common/Input';

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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            if (value.trim()) {
                sendMessage(value.trim());
                setValue('');
            }
        }
    };

    return (
        <div className="py-2 px-1 bg-background/50 border-t border-border-subtle">
            <Input
                placeholder="Type a message..."
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    sendTyping();
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-[var(--bg-msg-input)]"
            />
        </div>
    );
};
