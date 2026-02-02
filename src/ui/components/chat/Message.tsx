import React from 'react';

import { SmilePlus } from 'lucide-react';

import { useAddReaction } from '@/api/reactions/reactions.queries';
import { useMembers } from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { EmojiPicker } from '@/ui/components/emoji/EmojiPicker';
import { Box } from '@/ui/components/layout/Box';
import { ProfilePopup } from '@/ui/components/profile/ProfilePopup';
import { cn } from '@/utils/cn';

import { MessageContent } from './MessageContent';
import { MessageHeader } from './MessageHeader';
import { Reactions } from './Reactions';
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
    const [showPicker, setShowPicker] = React.useState(false);
    const avatarRef = React.useRef<HTMLDivElement>(null);
    const pickerRef = React.useRef<HTMLDivElement>(null);
    const { data: me } = useMe();
    const { data: members } = useMembers(message.serverId ?? null);
    const addReaction = useAddReaction();
    const { customCategories } = useCustomEmojis();

    const myId = me?._id;
    const mentionsMe = React.useMemo(() => {
        if (!myId) return false;

        // Direct mention
        if (message.text.includes(`<userid:'${myId}'>`)) return true;

        // Everyone mention
        if (message.text.includes('<everyone>')) return true;

        // Role mention
        const myMember = members?.find((m) => m.userId === myId);
        if (
            myMember &&
            myMember.roles.some((roleId) =>
                message.text.includes(`<roleid:'${roleId}'>`),
            )
        ) {
            return true;
        }

        return false;
    }, [message.text, myId, members]);

    const handleEmojiSelect = (emoji: string): void => {
        addReaction.mutate({
            messageId: message._id,
            serverId: message.serverId,
            channelId: message.channelId,
            data: { emoji, emojiType: 'unicode' },
        });
        setShowPicker(false);
    };

    const handleCustomEmojiSelect = (emoji: {
        id: string;
        name: string;
    }): void => {
        addReaction.mutate({
            messageId: message._id,
            serverId: message.serverId,
            channelId: message.channelId,
            data: { emoji: emoji.name, emojiType: 'custom', emojiId: emoji.id },
        });
        setShowPicker(false);
    };

    // Close picker when clicking outside
    React.useEffect(() => {
        if (!showPicker) return;

        const handleClickOutside = (event: MouseEvent): void => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node)
            ) {
                setShowPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPicker]);

    return (
        <Box
            className={cn(
                'group relative px-4 py-0.5 hover:bg-white/[0.02] transition-colors flex flex-col',
                isGroupStart ? 'mt-1' : 'mt-0',
                isHighlighted && 'bg-blue-500/10 hover:bg-blue-500/15',
                mentionsMe && 'border-l-2 border-caution',
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
                        <Text className="opacity-0 group-hover:opacity-40 text-[10px] text-muted-foreground font-medium select-none mt-1">
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
                    <Reactions
                        channelId={message.channelId}
                        messageId={message._id}
                        reactions={message.reactions || []}
                        serverId={message.serverId}
                        onAddClick={() => setShowPicker(true)}
                    />
                </Box>
            </Box>

            {/* Hover Actions */}
            <Box className="absolute right-4 top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all z-[var(--z-effect-md)]">
                <Box className="flex items-center bg-bg-secondary border border-white/5 rounded shadow-xl px-1 py-1 gap-1">
                    <button
                        className={cn(
                            'p-1.5 hover:bg-white/5 rounded transition-colors text-muted-foreground hover:text-foreground',
                            showPicker && 'bg-white/10 text-foreground',
                        )}
                        title="Add Reaction"
                        onClick={() => setShowPicker(!showPicker)}
                    >
                        <SmilePlus size={18} />
                    </button>
                    {/* Actions will go here but emojis for now uwu */}
                </Box>

                {showPicker && (
                    <Box
                        className="absolute bottom-full right-0 mb-2 z-[var(--z-popover)]"
                        ref={pickerRef}
                    >
                        <EmojiPicker
                            customCategories={customCategories}
                            onCustomEmojiSelect={handleCustomEmojiSelect}
                            onEmojiSelect={handleEmojiSelect}
                        />
                    </Box>
                )}
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
