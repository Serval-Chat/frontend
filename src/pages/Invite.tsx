import React from 'react';

import {
    Infinity as InfinityIcon /* This is to prevent name shadowing, thx javascript */,
    BadgeCheck,
    CircleOff,
    Tag,
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
                    'relative h-[140px] w-full flex-shrink-0 overflow-hidden rounded-t-lg',
                    !hasBanner && 'bg-bg-secondary',
                )}
            >
                {hasBanner && (
                    <>
                        {banner.type === 'image' || banner.type === 'gif' ? (
                            <img
                                alt={name}
                                className="h-full w-full object-cover"
                                src={bannerUrl ?? ''}
                            />
                        ) : (
                            <div
                                className="h-full w-full"
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

                {loading && <Skeleton className="h-full w-full rounded-none" />}
            </div>

            {/* Server icon */}
            <div className="absolute bottom-0 left-1/2 z-content -translate-x-1/2 translate-y-1/2">
                {loading ? (
                    <Skeleton
                        className="h-20 w-20 rounded-[1.8rem] ring-4 ring-bg-subtle"
                        variant="rectangular"
                    />
                ) : (
                    <div className="rounded-[1.8rem] ring-4 ring-bg-subtle">
                        <ServerIcon server={{ name, icon }} size="xl" />
                    </div>
                )}
            </div>
        </div>
    );
};

const InvalidInvite: React.FC = () => (
    <div className="relative z-content space-y-md text-center">
        <div className="flex justify-center text-muted-foreground/50">
            <CircleOff size={64} strokeWidth={1.5} />
        </div>
        <Heading variant="page">Invalid Invite</Heading>
        <Text as="p" className="text-muted-foreground">
            This invite link is invalid, has expired, or has reached its maximum
            number of uses.
        </Text>
        <Link className="mt-sm inline-block text-sm font-medium" to="/">
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
        <Box className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-md">
            <DefaultBackground />

            {showError ? (
                <InvalidInvite />
            ) : (
                /* Invite card */
                <div className="relative z-content flex w-full max-w-sm flex-col overflow-visible rounded-lg border border-border-subtle bg-bg-subtle/50 shadow-lg backdrop-blur-xl">
                    {/* Banner + icon header */}
                    <InviteBannerHeader
                        banner={data?.server.banner}
                        icon={data?.server.icon}
                        loading={showSkeleton}
                        name={data?.server.name ?? ''}
                    />

                    {/* Card body */}
                    <div className="flex flex-col items-center gap-sm px-lg pt-14 pb-lg text-center">
                        {/* Server name */}
                        {showSkeleton ? (
                            <Skeleton className="h-7 w-40" variant="text" />
                        ) : (
                            <Heading
                                className="flex items-center justify-center gap-2 text-xl leading-tight"
                                variant="page"
                            >
                                {data?.server.verified && (
                                    <BadgeCheck
                                        className="shrink-0 text-primary"
                                        size={20}
                                    />
                                )}
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

                        {/* Server Tags */}
                        {!showSkeleton &&
                            data?.server.tags &&
                            data.server.tags.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-1.5 pt-0.5">
                                    {data.server.tags.map((tag) => (
                                        <span
                                            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary"
                                            key={tag}
                                        >
                                            <Tag
                                                className="opacity-60"
                                                size={10}
                                            />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
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
                                className="mt-sm w-full py-sm text-base font-semibold"
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
