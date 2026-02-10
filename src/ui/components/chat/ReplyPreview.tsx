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
    disableGlow?: boolean;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
    user,
    role,
    text,
    replyToId,
    onClick,
    disableCustomFonts,
    disableGlow,
}) => {
    const nodes = useMemo(() => parseText(text, ParserPresets.MESSAGE), [text]);
    return (
        <Box
            className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group/reply select-none ml-[24px]"
            onClick={() => replyToId && onClick?.(replyToId)}
        >
            {/* Spine */}
            <Box className="w-[36px] h-[18px] border-l-2 border-t-2 border-border-subtle rounded-tl-lg mt-[11px] flex-shrink-0" />

            <Box className="flex items-center gap-1.5 overflow-hidden min-w-0">
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
                    disableGlow={disableGlow}
                    role={role}
                    user={user}
                >
                    {user.displayName || user.username}
                </StyledUserName>
                <Text
                    as="span"
                    className="text-xs text-muted-foreground truncate font-medium"
                >
                    <ParsedText condenseFiles nodes={nodes} size="xs" />
                </Text>
            </Box>
        </Box>
    );
};
