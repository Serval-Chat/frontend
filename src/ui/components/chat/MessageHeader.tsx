import type { User } from '@/api/users/users.types';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { formatDiscordTimestamp } from '@/utils/timestamp';

interface MessageHeaderProps {
    user: User;
    timestamp: string;
    isGroupStart?: boolean;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({
    user,
    timestamp,
    isGroupStart = true,
}) => {
    if (!isGroupStart) return null;

    return (
        <div className="flex items-baseline gap-2 mb-0.5">
            <StyledUserName user={user}>
                {user.displayName || user.username}
            </StyledUserName>
            <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                {formatDiscordTimestamp(timestamp)}
            </span>
        </div>
    );
};
