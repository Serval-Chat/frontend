import React from 'react';

import type { User } from '@/api/users/users.types';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { cn } from '@/utils/cn';

import { MessageContent } from './MessageContent';
import { MessageHeader } from './MessageHeader';
import { ReplyPreview } from './ReplyPreview';

interface MessageProps {
    message: {
        _id: string;
        text: string;
        createdAt: string;
        replyTo?: {
            _id: string;
            user: User;
            text: string;
        };
    };
    user: User;
    isGroupStart?: boolean;
    isHighlighted?: boolean;
    onReplyClick?: (messageId: string) => void;
}

export const Message: React.FC<MessageProps> = ({
    message,
    user,
    isGroupStart = true,
    isHighlighted = false,
    onReplyClick,
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
                    text={message.replyTo.text}
                    replyToId={message.replyTo._id}
                    onClick={onReplyClick}
                />
            )}

            <div className="flex gap-1">
                {/* Avatar / Gutter space */}
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
                        timestamp={message.createdAt}
                        isGroupStart={isGroupStart}
                    />
                    <MessageContent text={message.text} />
                </div>
            </div>

            {/* Hover Actions (Placeholder) */}
            <div className="absolute right-4 top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                <div className="flex items-center bg-[#2b2d31] border border-white/5 rounded shadow-xl px-1 py-1 gap-1">
                    {/* Actions will go here but none for now uwu */}
                </div>
            </div>
        </div>
    );
};
