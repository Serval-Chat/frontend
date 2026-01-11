import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { cn } from '@/utils/cn';
import { formatDiscordTimestamp } from '@/utils/timestamp';

interface MessageHeaderProps {
    user: User;
    role?: Role;
    timestamp: string;
    isGroupStart?: boolean;
    disableCustomFonts?: boolean;
    onClickName?: () => void;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({
    user,
    role,
    timestamp,
    isGroupStart = true,
    disableCustomFonts,
    onClickName,
}) => {
    if (!isGroupStart) return null;

    return (
        <div className="flex items-baseline gap-2 mb-0.5">
            <div
                onClick={onClickName}
                className={cn(
                    onClickName &&
                        'cursor-pointer hover:underline underline-offset-2'
                )}
            >
                <StyledUserName
                    user={user}
                    role={role}
                    disableCustomFonts={disableCustomFonts}
                >
                    {user.displayName || user.username}
                </StyledUserName>
            </div>

            <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                {formatDiscordTimestamp(timestamp)}
            </span>
        </div>
    );
};
