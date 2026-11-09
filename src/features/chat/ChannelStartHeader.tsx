import React from 'react';

import type { Channel } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
import { ChannelIcon } from '@/features/servers/ChannelIcon';
import { UserProfilePicture } from '@/features/users/UserProfilePicture';
import { Box } from '@/ui/primitives/Box';
import { Divider } from '@/ui/primitives/Divider';
import { Text } from '@/ui/primitives/Text';
import { resolveDisplayName } from '@/utils/displayName';

export interface ChannelStartHeaderProps {
    channel?: Channel;
    friendUser?: User;
}

export const ChannelStartHeader = ({
    channel,
    friendUser,
}: ChannelStartHeaderProps): React.ReactNode => {
    if (friendUser) {
        const displayName =
            resolveDisplayName(
                undefined,
                friendUser.displayName,
                friendUser.username,
            ) || 'User';

        return (
            <Box className="flex flex-col items-start px-4 pt-8 pb-4 select-none">
                <Box className="mb-3">
                    <UserProfilePicture
                        noIndicator
                        size="xl"
                        src={friendUser.profilePicture}
                        username={friendUser.username}
                    />
                </Box>
                <Text className="text-2xl font-bold text-foreground md:text-3xl">
                    {displayName}
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                    This is the start of your direct message history with{' '}
                    <Text variant="default" weight="semibold">
                        {displayName}
                    </Text>
                    .
                </Text>
                <Divider className="mt-4" variant="line" />
            </Box>
        );
    }

    if (channel) {
        const prefix = channel.type === 'text' ? '#' : '';

        return (
            <Box className="flex flex-col items-start px-4 pt-8 pb-4 select-none">
                <Box className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs">
                    <ChannelIcon
                        className="h-8 w-8"
                        emoji={channel.emoji}
                        emojiType={channel.emojiType}
                        icon={channel.icon}
                        type={channel.type}
                    />
                </Box>
                <Text className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    Welcome to {prefix}
                    {channel.name}!
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                    This is the start of the{' '}
                    <Text variant="default" weight="semibold">
                        {prefix}
                        {channel.name}
                    </Text>{' '}
                    channel.
                </Text>
                {channel.description ? (
                    <Box className="max-w-2xl text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {channel.description}
                    </Box>
                ) : null}
                <Divider className="mt-4" variant="line" />
            </Box>
        );
    }

    return null;
};
