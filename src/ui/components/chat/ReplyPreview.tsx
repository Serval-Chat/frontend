import React, { useMemo } from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
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
    replyToId?: string;
    onClick?: (messageId: string) => void;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
    user,
    role,
    text,
    replyToId,
    onClick,
    disableCustomFonts,
    disableGlowAndColors,
}) => {
    const nodes = useMemo(() => parseText(text, ParserPresets.MESSAGE), [text]);
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
                    disableCustomFonts={disableCustomFonts}
                    disableGlowAndColors={disableGlowAndColors}
                    role={role}
                    user={user}
                >
                    {user.displayName || user.username}
                </StyledUserName>
                <Text
                    as="span"
                    className="truncate text-xs font-medium text-muted-foreground"
                >
                    <ParsedText
                        condenseFiles
                        nodes={nodes}
                        size="xs"
                        wrap="nowrap"
                    />
                </Text>
            </Box>
        </Box>
    );
};
