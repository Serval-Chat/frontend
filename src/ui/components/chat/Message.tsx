import React from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';
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
    disableGlow?: boolean;
}

export const Message: React.FC<MessageProps> = ({
    message,
    user,
    role,
    isGroupStart = true,
    isHighlighted = false,
    onReplyClick,
    disableCustomFonts,
    disableGlow,
}) => {
    const [showProfile, setShowProfile] = React.useState(false);
    const avatarRef = React.useRef<HTMLDivElement>(null);

    return (
        <Box
            className={cn(
                'group relative px-4 py-0.5 hover:bg-white/[0.02] transition-colors flex flex-col',
                isGroupStart ? 'mt-1' : 'mt-0',
                isHighlighted && 'bg-blue-500/10 hover:bg-blue-500/15',
            )}
            id={`message-${message._id}`}
        >
            {/* Reply Preview */}
            {isGroupStart && message.replyTo && (
                <ReplyPreview
                    disableCustomFonts={disableCustomFonts}
                    replyToId={message.replyTo._id}
                    role={message.replyTo.role}
                    text={message.replyTo.text}
                    user={message.replyTo.user}
                    onClick={onReplyClick}
                />
            )}

            <Box className="flex gap-1">
                {/* Avatar */}
                <Box
                    className="w-12 flex-shrink-0 flex justify-center mt-1"
                    ref={avatarRef}
                >
                    {isGroupStart ? (
                        <UserProfilePicture
                            noIndicator
                            size="md"
                            src={user.profilePicture}
                            username={user.username}
                            onClick={() => setShowProfile(true)}
                        />
                    ) : (
                        <Text className="opacity-0 group-hover:opacity-40 text-[10px] text-white/50 font-medium select-none mt-1">
                            {
                                new Date(message.createdAt)
                                    .toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                    })
                                    .split(' ')[0]
                            }
                        </Text>
                    )}
                </Box>

                {/* Content Area */}
                <Box className="flex-1 min-w-0">
                    <MessageHeader
                        disableCustomFonts={disableCustomFonts}
                        disableGlow={disableGlow}
                        isGroupStart={isGroupStart}
                        role={role}
                        timestamp={message.createdAt}
                        user={user}
                        onClickName={() => setShowProfile(true)}
                    />
                    <MessageContent text={message.text} />
                </Box>
            </Box>

            {/* Hover Actions */}
            <Box className="absolute right-4 top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                <Box className="flex items-center bg-[#2b2d31] border border-white/5 rounded shadow-xl px-1 py-1 gap-1">
                    {/* Actions will go here but none for now uwu */}
                </Box>
            </Box>

            <ProfilePopup
                disableCustomFonts={disableCustomFonts}
                disableGlow={disableGlow}
                isOpen={showProfile}
                role={role}
                triggerRef={avatarRef}
                user={user}
                userId={user._id}
                onClose={() => setShowProfile(false)}
            />
        </Box>
    );
};
