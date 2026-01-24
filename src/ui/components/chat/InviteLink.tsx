import React from 'react';

import { useInviteDetails, useJoinServer } from '@/api/invites/invites.queries';
import { useServers } from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';

interface InviteLinkProps {
    code: string;
    url: string;
}

export const InviteLink: React.FC<InviteLinkProps> = ({ code, url }) => {
    const { data: invite, isLoading, error } = useInviteDetails(code);
    const { data: servers } = useServers();
    const joinServerMutation = useJoinServer();

    const isJoined = servers?.some((s) => s._id === invite?.server.id);

    if (isLoading) {
        return (
            <Box className="w-fit min-w-[300px] my-2 flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary p-4">
                <LoadingSpinner size="sm" />
                <Text size="sm" variant="muted">
                    Fetching invite details...
                </Text>
            </Box>
        );
    }

    if (error || !invite) {
        return (
            <a
                className="text-primary transition-all hover:underline"
                href={url}
                rel="noopener noreferrer"
                target="_blank"
            >
                {url}
            </a>
        );
    }

    const handleJoin = (): void => {
        if (!isJoined) {
            joinServerMutation.mutate(code);
        }
    };

    const iconUrl = resolveApiUrl(invite.server.icon);
    const bannerUrl =
        invite.server.banner?.type === 'image'
            ? resolveApiUrl(invite.server.banner.value)
            : null;

    return (
        <Box className="w-[320px] my-2 flex flex-col overflow-hidden rounded-lg bg-bg-secondary transition-all">
            {/* Banner */}
            <div className="bg-primary/10 h-20 w-full overflow-hidden">
                {bannerUrl && (
                    <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={bannerUrl}
                    />
                )}
            </div>

            <div className="flex flex-col gap-4 p-4">
                <Text
                    className="uppercase tracking-wider"
                    size="xs"
                    variant="muted"
                    weight="bold"
                >
                    You've been invited to a server
                </Text>

                <div className="flex items-center gap-3">
                    {iconUrl ? (
                        <img
                            alt={invite.server.name}
                            className="bg-background h-12 w-12 rounded-xl object-cover shadow-sm"
                            src={iconUrl}
                        />
                    ) : (
                        <div className="bg-primary/20 text-primary flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold">
                            {invite.server.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="flex min-w-0 flex-col">
                        <Text className="truncate" size="lg" weight="bold">
                            {invite.server.name}
                        </Text>
                        <div className="flex items-center gap-2">
                            <div className="bg-success h-2 w-2 animate-pulse rounded-full" />
                            <Text size="xs" variant="muted">
                                {invite.memberCount}{' '}
                                {invite.memberCount === 1
                                    ? 'Member'
                                    : 'Members'}
                            </Text>
                        </div>
                    </div>
                </div>

                <Button
                    className="w-full"
                    disabled={isJoined}
                    loading={joinServerMutation.isPending}
                    size="sm"
                    variant={isJoined ? 'normal' : 'primary'}
                    onClick={handleJoin}
                >
                    {isJoined ? 'Joined' : 'Join Server'}
                </Button>
            </div>
        </Box>
    );
};
