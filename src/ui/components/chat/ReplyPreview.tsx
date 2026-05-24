import React, { useMemo } from 'react';

import type { MessageAttachment } from '@/api/chat/chat.types';
import type { Role } from '@/api/servers/servers.types';
import { useUserById } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import type { InteractionValue } from '@/types/interactions';
import { BotTag } from '@/ui/components/common/BotTag';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { ParserPresets, parseText } from '@/utils/textParser/parser';

interface ReplyPreviewProps {
    user: User;
    role?: Role;
    text: string;
    attachments?: MessageAttachment[];
    interaction?: {
        command: string;
        options?: { name: string; value: InteractionValue }[];
        user: { id: string; username: string };
    };
    replyToId?: string;
    isWebhook?: boolean;
    onClick?: (messageId: string) => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = React.memo(
    ({
        user: initialUser,
        role,
        text,
        attachments,
        interaction,
        replyToId,
        isWebhook,
        onClick,
        disableCustomFonts,
        disableGlowAndColors,
        disableColors,
        disableGlow,
    }) => {
        const isUnknownUser = initialUser.username === 'Unknown';
        const { data: fetchedUser } = useUserById(initialUser._id, {
            enabled: isUnknownUser,
        });
        const user = isUnknownUser && fetchedUser ? fetchedUser : initialUser;

        const nodes = useMemo(
            () => parseText(text, ParserPresets.MESSAGE),
            [text],
        );
        const command = interaction?.command?.trim();
        const hasAttachments = (attachments?.length ?? 0) > 0;
        return (
            <Box
                className="group/reply ml-[24px] flex cursor-pointer items-center gap-2 opacity-60 transition-opacity select-none hover:opacity-100"
                onClick={() => replyToId && onClick?.(replyToId)}
            >
                {/* Spine */}
                <Box className="mt-[11px] h-[18px] w-[36px] flex-shrink-0 rounded-tl-lg border-t-2 border-l-2 border-border-subtle" />

                <Box className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                    <UserProfilePicture
                        noIndicator
                        size="xs"
                        src={user.profilePicture}
                        username={user.username}
                    />
                    <StyledUserName
                        showIcon
                        className="text-xs font-bold whitespace-nowrap opacity-90"
                        disableColors={disableColors}
                        disableCustomFonts={disableCustomFonts}
                        disableGlow={disableGlow}
                        disableGlowAndColors={disableGlowAndColors}
                        role={role}
                        user={user}
                    >
                        {user.displayName || user.username}
                    </StyledUserName>
                    {user.isBot && <BotTag className="h-3.5 px-1 text-[8px]" />}
                    {isWebhook && (
                        <BotTag
                            className="h-3.5 px-1 text-[8px]"
                            label="WEBHOOK"
                        />
                    )}
                    <Text
                        as="span"
                        className="truncate text-xs font-medium text-text-muted"
                    >
                        {command && !text && (
                            <span className="mr-1 opacity-70">
                                used{' '}
                                <span className="text-primary">/{command}</span>
                            </span>
                        )}
                        {!command && !text && hasAttachments && (
                            <span className="opacity-70">Attachment(-s)</span>
                        )}
                        <ParsedText
                            condenseCodeBlocks
                            condenseFiles
                            condenseInvites
                            nodes={nodes}
                            size="xs"
                            wrap="nowrap"
                        />
                    </Text>
                </Box>
            </Box>
        );
    },
);

ReplyPreview.displayName = 'ReplyPreview';
