import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Check, Copy, Tag } from 'lucide-react';

import { useInviteDetails, useJoinServer } from '@/api/invites/invites.queries';
import { useServers } from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { Box } from '@/ui/components/layout/Box';
import { resolveServerBannerUrl } from '@/ui/components/servers/bannerUtils';
import { resolveApiUrl } from '@/utils/apiUrl';

interface InviteLinkProps {
    code: string;
    url: string;
}

const INVITE_TAG_SKELETONS = [
    { id: 'tag-skel-name', widthClassName: 'w-16' },
    { id: 'tag-skel-count', widthClassName: 'w-12' },
    { id: 'tag-skel-server', widthClassName: 'w-20' },
    { id: 'tag-skel-status', widthClassName: 'w-14' },
    { id: 'tag-skel-owner', widthClassName: 'w-24' },
    { id: 'tag-skel-kind', widthClassName: 'w-10' },
    { id: 'tag-skel-region', widthClassName: 'w-18' },
    { id: 'tag-skel-members', widthClassName: 'w-16' },
    { id: 'tag-skel-activity', widthClassName: 'w-20' },
    { id: 'tag-skel-age', widthClassName: 'w-12' },
];

export const InviteLinkSkeleton = ({
    containerRef,
    hasBanner,
    tagCount = 0,
}: {
    containerRef?: React.Ref<HTMLDivElement>;
    hasBanner?: boolean;
    tagCount?: number;
}) => (
    <Box
        className="my-2 flex w-80 flex-col overflow-hidden rounded-lg bg-bg-secondary transition-all"
        ref={containerRef}
    >
        {hasBanner ? (
            <Skeleton
                className="h-20 w-full rounded-none"
                variant="rectangular"
            />
        ) : null}

        <div className="flex flex-col gap-4 p-4">
            <Skeleton className="h-3 w-40" variant="text" />

            <div className="flex items-center gap-3">
                <Skeleton
                    className="h-12 w-12 shrink-0 rounded-xl"
                    variant="rectangular"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" variant="text" />
                    <Skeleton className="h-3 w-1/2" variant="text" />
                </div>
            </div>

            {tagCount > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {INVITE_TAG_SKELETONS.slice(0, tagCount).map((tag) => (
                        <Skeleton
                            className={`h-5 ${tag.widthClassName}`}
                            key={tag.id}
                            variant="rectangular"
                        />
                    ))}
                </div>
            ) : null}

            <Skeleton className="h-8 w-full" variant="rectangular" />
        </div>
    </Box>
);

export const InviteLink = ({ code, url }: InviteLinkProps) => {
    const queryClient = useQueryClient();
    const [inView, setInView] = React.useState(
        (): boolean => !!queryClient.getQueryData(['invites', 'details', code]),
    );
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect((): (() => void) | undefined => {
        if (inView) return;

        const observer = new IntersectionObserver(
            ([entry]): void => {
                if (entry?.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' },
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return (): void => {
            observer.disconnect();
        };
    }, [inView]);

    const {
        data: invite,
        isLoading,
        error,
    } = useInviteDetails(code, {
        enabled: inView,
    });

    const { data: servers } = useServers();
    const joinServerMutation = useJoinServer();

    const [copied, setCopied] = React.useState(false);
    const { showToast } = useToast();

    const isJoined = servers?.some((s): boolean => s.id === invite?.server.id);

    const handleCopy = (): void => {
        void navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout((): void => {
            setCopied(false);
        }, 1500);
        showToast('Copied the invite URL in to the clipboard!', 'success');
    };

    if (isLoading || !inView) {
        return <InviteLinkSkeleton containerRef={containerRef} />;
    }

    if (error || !invite) {
        return (
            <Box className="my-2 flex w-80 flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary p-4 opacity-60">
                <Text className="text-error" size="sm" weight="bold">
                    Invite Invalid or Expired
                </Text>
                <Text className="mt-1" size="xs" variant="muted">
                    This server invite is either invalid or has reached its
                    maximum uses.
                </Text>
                <a
                    className="mt-3 text-xs text-primary transition-all hover:underline"
                    href={url}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {url}
                </a>
            </Box>
        );
    }

    const handleJoin = (): void => {
        if (!isJoined) {
            joinServerMutation.mutate(code);
        }
    };

    const iconUrl = resolveApiUrl(invite.server.icon);
    const bannerUrl =
        invite.server.banner?.type === 'image' ||
        invite.server.banner?.type === 'gif'
            ? resolveServerBannerUrl(invite.server.banner.value)
            : null;

    return (
        <Box className="my-2 flex w-80 flex-col overflow-hidden rounded-lg bg-bg-secondary transition-all">
            {/* Copy server link button */}
            <div className="relative">
                <button
                    className="hover:bg-bg-tertiary absolute top-2 right-2 z-10 rounded-md p-1.5 text-muted-foreground opacity-40 transition-all hover:opacity-100"
                    type="button"
                    onClick={handleCopy}
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
            </div>

            {/* Banner */}
            {bannerUrl ? (
                <div className="h-20 w-full overflow-hidden bg-primary/10">
                    <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={bannerUrl}
                    />
                </div>
            ) : null}

            <div className="flex flex-col gap-4 p-4">
                <Text
                    className="tracking-wider uppercase"
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
                            className="h-12 w-12 rounded-xl bg-background object-cover shadow-sm"
                            src={iconUrl}
                        />
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-xl font-bold text-primary">
                            {invite.server.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="flex min-w-0 flex-col">
                        <div className="flex items-center gap-1.5">
                            {invite.server.verified ? (
                                <BadgeCheck
                                    className="shrink-0 text-primary"
                                    size={18}
                                    strokeWidth={2.5}
                                />
                            ) : null}
                            <Text className="truncate" size="lg" weight="bold">
                                {invite.server.name}
                            </Text>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                            <Text size="xs" variant="muted">
                                {invite.memberCount}{' '}
                                {invite.memberCount === 1
                                    ? 'Member'
                                    : 'Members'}
                            </Text>
                        </div>
                    </div>
                </div>

                {invite.server.tags && invite.server.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {invite.server.tags.map((tag) => (
                            <div
                                className="flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary ring-1 ring-primary/20"
                                key={tag}
                            >
                                <Tag className="opacity-60" size={8} />
                                {tag}
                            </div>
                        ))}
                    </div>
                ) : null}

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
