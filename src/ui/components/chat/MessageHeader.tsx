import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { formatDiscordTimestamp } from '@/utils/timestamp';

interface MessageHeaderProps {
    user: User;
    role?: Role;
    timestamp: string;
    isGroupStart?: boolean;
    disableCustomFonts?: boolean;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({
    user,
    role,
    timestamp,
    isGroupStart = true,
    disableCustomFonts,
}) => {
    if (!isGroupStart) return null;

    return (
        <div className="flex items-baseline gap-2 mb-0.5">
            <StyledUserName
                user={user}
                role={role}
                disableCustomFonts={disableCustomFonts}
            >
                {user.displayName || user.username}
            </StyledUserName>
            <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                {formatDiscordTimestamp(timestamp)}
            </span>
        </div>
    );
};
