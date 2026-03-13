import React, { useMemo } from 'react';

import { Hash, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useChannels, useServerDetails } from '@/api/servers/servers.queries';
import { useAppSelector } from '@/store/hooks';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { ICON_MAP } from '@/ui/utils/iconMap';

interface ChannelLinkProps {
    serverId: string;
    channelId: string;
    messageId?: string;
}

/**
 * @description Renders a channel link.
 */
export const ChannelLink: React.FC<ChannelLinkProps> = ({
    serverId,
    channelId,
    messageId,
}) => {
    const navigate = useNavigate();
    const selectedServerId = useAppSelector(
        (state) => state.nav.selectedServerId,
    );
    const { data: server, isLoading: serverLoading } =
        useServerDetails(serverId);
    const { data: channels, isLoading: channelsLoading } =
        useChannels(serverId);
    const isCrossingServers = selectedServerId && selectedServerId !== serverId;

    const channel = useMemo(() => {
        if (!channels) return null;
        return channels.find((ch) => ch._id === channelId) || null;
    }, [channels, channelId]);

    const isLoading = serverLoading || channelsLoading;
    const displayName =
        channel?.name || (isLoading ? '...' : 'unknown channel');
    const displayText = isCrossingServers
        ? `${server?.name || '...'} > ${displayName}`
        : `${displayName}`;
    const channelType = channel?.type || 'text';

    // Get the channel icon
    const CustomIcon = channel?.icon ? ICON_MAP[channel.icon] : null;
    const Icon = CustomIcon || (channelType === 'text' ? Hash : Volume2);

    const handleClick = (): void => {
        if (server && channel) {
            if (messageId) {
                void navigate(
                    `/chat/@server/${server._id}/channel/${channel._id}/message/${messageId}`,
                );
            } else {
                void navigate(
                    `/chat/@server/${server._id}/channel/${channel._id}`,
                );
            }
        }
    };

    return (
        <Box
            as="span"
            className="inline-flex cursor-pointer items-center rounded bg-primary/10 px-1.5 py-[4px] font-medium text-primary transition-colors select-none hover:bg-primary/20"
            onClick={handleClick}
        >
            <Icon className="mr-1" size="14" />
            <Text as="span" className="leading-none" size="sm" variant="muted">
                {displayText}
            </Text>
        </Box>
    );
};
