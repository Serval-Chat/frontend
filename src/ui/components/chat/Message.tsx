import React from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { cn } from '@/utils/cn';

import { MessageContent } from './MessageContent';
import { MessageHeader } from './MessageHeader';
import { ReplyPreview } from './ReplyPreview';

interface MessageProps {
    message: ProcessedChatMessage;
    user: User;
    role?: Role;
    isGroupStart?: boolean;
    isHighlighted?: boolean;
    onReplyClick?: (messageId: string) => void;
    disableCustomFonts?: boolean;
}

export const Message: React.FC<MessageProps> = ({
    message,
    user,
    role,
    isGroupStart = true,
    isHighlighted = false,
    onReplyClick,
    disableCustomFonts,
}) => {
    return (
        <div
            id={`message-${message._id}`}
            className={cn(
                'group relative px-4 py-0.5 hover:bg-white/[0.02] transition-colors flex flex-col',
                isGroupStart ? 'mt-1' : 'mt-0',
                isHighlighted && 'bg-blue-500/10 hover:bg-blue-500/15'
            )}
        >
            {/* Reply Preview */}
            {isGroupStart && message.replyTo && (
                <ReplyPreview
                    user={message.replyTo.user}
                    role={message.replyTo.role}
                    text={message.replyTo.text}
                    replyToId={message.replyTo._id}
                    onClick={onReplyClick}
                    disableCustomFonts={disableCustomFonts}
                />
            )}

            <div className="flex gap-1">
                {/* Avatar */}
                <div className="w-12 flex-shrink-0 flex justify-center mt-1">
                    {isGroupStart ? (
                        <UserProfilePicture
                            src={user.profilePicture}
                            username={user.username}
                            size="md"
                            noIndicator={true}
                        />
                    ) : (
                        <span className="opacity-0 group-hover:opacity-40 text-[10px] text-white/50 font-medium select-none mt-1">
                            {
                                new Date(message.createdAt)
                                    .toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                    })
                                    .split(' ')[0]
                            }
                        </span>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <MessageHeader
                        user={user}
                        role={role}
                        timestamp={message.createdAt}
                        isGroupStart={isGroupStart}
                        disableCustomFonts={disableCustomFonts}
                    />
                    <MessageContent text={message.text} />
                </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute right-4 top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                <div className="flex items-center bg-[#2b2d31] border border-white/5 rounded shadow-xl px-1 py-1 gap-1">
                    {/* Actions will go here but none for now uwu */}
                </div>
            </div>
        </div>
    );
};
