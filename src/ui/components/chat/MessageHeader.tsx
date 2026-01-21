import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';
import { formatTimestamp } from '@/utils/timestamp';

interface MessageHeaderProps {
    user: User;
    role?: Role;
    timestamp: string;
    isGroupStart?: boolean;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
    onClickName?: () => void;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({
    user,
    role,
    timestamp,
    isGroupStart = true,
    disableCustomFonts,
    disableGlow,
    onClickName,
}) => {
    if (!isGroupStart) return null;

    return (
        <Box className="flex items-baseline gap-2 mb-0.5">
            <Box
                className={cn(
                    onClickName &&
                        'cursor-pointer hover:underline underline-offset-2',
                )}
                onClick={onClickName}
            >
                <StyledUserName
                    disableCustomFonts={disableCustomFonts}
                    disableGlow={disableGlow}
                    role={role}
                    user={user}
                >
                    {user.displayName || user.username}
                </StyledUserName>
            </Box>

            <Text className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {formatTimestamp(timestamp)}
            </Text>
        </Box>
    );
};
