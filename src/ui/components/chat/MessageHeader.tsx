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
    iconRole?: Role;
    timestamp: string;
    isGroupStart?: boolean;
    disableCustomFonts?: boolean;
    disableGlowAndColors?: boolean;
    disableColors?: boolean;
    disableGlow?: boolean;
    onClickName?: () => void;
    isEdited?: boolean;
    editedAt?: string;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({
    user,
    role,
    iconRole,
    timestamp,
    isGroupStart = true,
    disableCustomFonts,
    disableGlowAndColors,
    disableColors,
    disableGlow,
    onClickName,
    isEdited,
    editedAt,
}) => {
    if (!isGroupStart) return null;

    return (
        <Box className="mb-0.5 flex items-baseline gap-2">
            <Box
                className={cn(
                    onClickName &&
                        'cursor-pointer underline-offset-2 hover:underline',
                )}
                onClick={onClickName}
            >
                <StyledUserName
                    showIcon
                    disableColors={disableColors}
                    disableCustomFonts={disableCustomFonts}
                    disableGlow={disableGlow}
                    disableGlowAndColors={disableGlowAndColors}
                    iconRole={iconRole}
                    role={role}
                    user={user}
                >
                    {user.displayName || user.username}
                </StyledUserName>
            </Box>

            <Text className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {formatTimestamp(timestamp)}
            </Text>

            {isEdited && (
                <Text className="text-[10px] font-medium text-muted-foreground italic">
                    (edited{editedAt ? ` ${formatTimestamp(editedAt)}` : ''})
                </Text>
            )}
        </Box>
    );
};
