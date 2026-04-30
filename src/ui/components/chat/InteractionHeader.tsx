import React from 'react';

import type { Role } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface InteractionHeaderProps {
    user: { id: string; username: string };
    command: string;
    resolvedUser?: User;
    role?: Role;
    disableColors?: boolean;
    disableCustomFonts?: boolean;
    disableGlow?: boolean;
    disableGlowAndColors?: boolean;
    isDeleted?: boolean;
}

export const InteractionHeader: React.FC<InteractionHeaderProps> = ({
    user,
    command,
    resolvedUser,
    role,
    disableColors,
    disableCustomFonts,
    disableGlow,
    disableGlowAndColors,
    isDeleted,
}) => (
    <Box className="ml-[24px] flex items-center gap-2 opacity-60 select-none">
        <Box className="mt-[11px] h-[18px] w-[36px] flex-shrink-0 rounded-tl-lg border-t-2 border-l-2 border-border-subtle" />

        <Box className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            <UserProfilePicture
                noIndicator
                size="xs"
                src={resolvedUser?.profilePicture}
                username={resolvedUser?.username || user.username}
            />
            <StyledUserName
                className="text-xs font-bold whitespace-nowrap opacity-90"
                disableColors={disableColors}
                disableCustomFonts={disableCustomFonts}
                disableGlow={disableGlow}
                disableGlowAndColors={disableGlowAndColors}
                role={role}
                user={resolvedUser || (user as unknown as User)}
            >
                {resolvedUser?.displayName ||
                    resolvedUser?.username ||
                    user.username}
            </StyledUserName>
            <Text
                as="span"
                className="text-xs whitespace-nowrap text-text-muted"
            >
                used{' '}
                <span
                    className={cn(
                        'font-bold',
                        isDeleted ? 'text-danger' : 'text-primary',
                    )}
                >
                    /{command}
                </span>
            </Text>
        </Box>
    </Box>
);
