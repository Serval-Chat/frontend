import React, { useMemo } from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { ParsedText } from '@/ui/components/common/ParsedText';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';
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
            <Box className="w-[36px] h-[18px] border-l-2 border-t-2 border-white/20 rounded-tl-lg mt-[11px] flex-shrink-0" />

            <Box className="flex items-center gap-1.5 overflow-hidden min-w-0">
                <Box className="w-4 h-4 rounded-full bg-white/10 overflow-hidden flex-shrink-0 ring-1 ring-white/5">
                    {resolveApiUrl(user.profilePicture) ? (
                        <img
                            alt=""
                            className="w-full h-full object-cover"
                            src={resolveApiUrl(user.profilePicture)!}
                        />
                    ) : (
                        <Box className="w-full h-full flex items-center justify-center bg-blue-500/20 text-[8px] font-bold text-blue-300">
                            {user.username[0].toUpperCase()}
                        </Box>
                    )}
                </Box>
                <StyledUserName
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
                    className="text-xs text-white/50 truncate font-medium"
                >
                    <ParsedText nodes={nodes} />
                </Text>
            </Box>
        </Box>
    );
};
