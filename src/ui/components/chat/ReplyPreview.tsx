import React from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { resolveApiUrl } from '@/utils/apiUrl';

interface ReplyPreviewProps {
    user: User;
    role?: Role;
    text: string;
    replyToId?: string;
    onClick?: (messageId: string) => void;
    disableCustomFonts?: boolean;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
    user,
    role,
    text,
    replyToId,
    onClick,
    disableCustomFonts,
}) => {
    return (
        <div
            onClick={() => replyToId && onClick?.(replyToId)}
            className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group/reply select-none ml-[24px]"
        >
            {/* Spine */}
            <div className="w-[36px] h-[18px] border-l-2 border-t-2 border-white/20 rounded-tl-lg mt-[11px] flex-shrink-0" />

            <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                <div className="w-4 h-4 rounded-full bg-white/10 overflow-hidden flex-shrink-0 ring-1 ring-white/5">
                    {resolveApiUrl(user.profilePicture) ? (
                        <img
                            src={resolveApiUrl(user.profilePicture)!}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500/20 text-[8px] font-bold text-blue-300">
                            {user.username[0].toUpperCase()}
                        </div>
                    )}
                </div>
                <StyledUserName
                    user={user}
                    role={role}
                    disableCustomFonts={disableCustomFonts}
                    className="text-xs font-bold whitespace-nowrap opacity-90"
                >
                    {user.displayName || user.username}
                </StyledUserName>
                <span className="text-xs text-white/50 truncate font-medium">
                    {text}
                </span>
            </div>
        </div>
    );
};
