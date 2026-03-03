import React from 'react';

import {
    Infinity as InfinityIcon /* This is to prevent name shadowing, thx javascript */,
    CircleOff,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { useInviteDetails, useJoinServer } from '@/api/invites/invites.queries';
import type { InviteServerBanner } from '@/api/invites/invites.types';
import { Button } from '@/ui/components/common/Button';
import { Divider } from '@/ui/components/common/Divider';
import { Heading } from '@/ui/components/common/Heading';
import { Link } from '@/ui/components/common/Link';
import { MutedText } from '@/ui/components/common/MutedText';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';
import { ServerIcon } from '@/ui/components/servers/ServerIcon';
import { resolveApiUrl } from '@/utils/apiUrl';
import { cn } from '@/utils/cn';

interface InviteBannerHeaderProps {
    name: string;
    banner?: InviteServerBanner;
    icon?: string;
    loading?: boolean;
}

const InviteBannerHeader: React.FC<InviteBannerHeaderProps> = ({
    name,
    banner,
    icon,
    loading,
}) => {
    const bannerUrl = resolveApiUrl(banner?.value);
    const hasBanner = !!banner && !loading;

    return (
        <div className="relative w-full">
            {/* Banner area */}
            <div
                className={cn(
                    'w-full h-[140px] flex-shrink-0 relative overflow-hidden rounded-t-lg',
                    !hasBanner && 'bg-bg-secondary',
                )}
            >
                {hasBanner && (
                    <>
                        {banner.type === 'image' || banner.type === 'gif' ? (
                            <img
                                alt={name}
                                className="w-full h-full object-cover"
                                src={bannerUrl ?? ''}
                            />
                        ) : (
                            <div
                                className="w-full h-full"
                                style={
                                    banner.type === 'gradient'
                                        ? { background: banner.value }
                                        : { backgroundColor: banner.value }
                                }
                            />
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/10 to-black/50" />
                    </>
                )}

                {loading && <Skeleton className="w-full h-full rounded-none" />}
            </div>

            {/* Server icon */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-content">
                {loading ? (
                    <Skeleton
                        className="w-20 h-20 rounded-[1.8rem] ring-4 ring-bg-subtle"
                        variant="rectangular"
                    />
                ) : (
                    <div className="ring-4 ring-[var(--color-bg-subtle)] rounded-[1.8rem]">
                        <ServerIcon server={{ name, icon }} size="xl" />
                    </div>
                )}
            </div>
        </div>
    );
};

const InvalidInvite: React.FC = () => (
    <div className="relative z-content text-center space-y-md">
        <div className="flex justify-center text-muted-foreground/50">
            <CircleOff size={64} strokeWidth={1.5} />
        </div>
        <Heading variant="page">Invalid Invite</Heading>
        <Text as="p" className="text-muted-foreground">
            This invite link is invalid, has expired, or has reached its maximum
            number of uses.
        </Text>
        <Link className="inline-block mt-sm text-sm font-medium" to="/">
            Go back home
        </Link>
    </div>
);

/**
 * @description Server invite landing page /invite/:inviteId
 */
export const Invite: React.FC = () => {
    const { inviteId = '' } = useParams<{ inviteId: string }>();
    const navigate = useNavigate();

    const { data, isLoading, isError } = useInviteDetails(inviteId);
    const {
        mutate: joinServer,
        isPending: isJoining,
        error: joinError,
    } = useJoinServer();

    const handleJoin = (): void => {
        joinServer(inviteId, {
            onSuccess: ({ serverId }) => {
                void navigate(`/chat/@server/${serverId}`);
            },
        });
    };

    const showSkeleton = isLoading;
    const showError = isError && !isLoading;

    return (
        <Box className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
            <DefaultBackground />

            {showError ? (
                <InvalidInvite />
            ) : (
                /* Invite card */
                <div className="relative z-content w-full max-w-sm bg-bg-subtle/50 backdrop-blur-xl border border-border-subtle rounded-lg shadow-lg overflow-visible flex flex-col">
                    {/* Banner + icon header */}
                    <InviteBannerHeader
                        banner={data?.server.banner}
                        icon={data?.server.icon}
                        loading={showSkeleton}
                        name={data?.server.name ?? ''}
                    />

                    {/* Card body */}
                    <div className="flex flex-col items-center text-center gap-sm px-lg pb-lg pt-14">
                        {/* Server name */}
                        {showSkeleton ? (
                            <Skeleton className="h-7 w-40" variant="text" />
                        ) : (
                            <Heading
                                className="text-xl leading-tight"
                                variant="page"
                            >
                                {data?.server.name}
                            </Heading>
                        )}

                        {/* Member count */}
                        {showSkeleton ? (
                            <Skeleton className="h-4 w-24" variant="text" />
                        ) : (
                            <MutedText className="text-sm">
                                {data?.memberCount.toLocaleString()}{' '}
                                {data?.memberCount === 1 ? 'member' : 'members'}
                            </MutedText>
                        )}

                        <Divider />

                        {/* Invite meta info */}
                        {!showSkeleton && data && (
                            <div className="flex flex-wrap justify-center gap-x-lg gap-y-xs text-xs text-muted-foreground">
                                {data.maxUses != null && (
                                    <span className="flex items-center gap-1">
                                        {data.uses} /{' '}
                                        {data.maxUses === 0 ? (
                                            <InfinityIcon
                                                size={14}
                                                strokeWidth={3}
                                            />
                                        ) : (
                                            data.maxUses
                                        )}{' '}
                                        uses
                                    </span>
                                )}
                                {data.expiresAt && (
                                    <span>
                                        Expires{' '}
                                        {new Date(
                                            data.expiresAt,
                                        ).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                )}
                            </div>
                        )}

                        {joinError && (
                            <Text
                                as="p"
                                className="text-sm text-danger-muted-text"
                            >
                                {(
                                    joinError.response?.data as {
                                        message?: string;
                                    }
                                )?.message ||
                                    joinError.message ||
                                    'Failed to join server'}
                            </Text>
                        )}

                        {/* CTA */}
                        {showSkeleton ? (
                            <Skeleton className="h-10 w-full rounded-md" />
                        ) : (
                            <Button
                                className="w-full mt-sm py-sm text-base font-semibold"
                                loading={isJoining}
                                variant="primary"
                                onClick={handleJoin}
                            >
                                Join Server
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Box>
    );
};
