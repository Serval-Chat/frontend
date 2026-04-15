import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Check, Copy, Tag } from 'lucide-react';

import { useInviteDetails, useJoinServer } from '@/api/invites/invites.queries';
import { useServers } from '@/api/servers/servers.queries';
import { Button } from '@/ui/components/common/Button';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { Box } from '@/ui/components/layout/Box';
import { resolveApiUrl } from '@/utils/apiUrl';

interface InviteLinkProps {
    code: string;
    url: string;
}

export const InviteLink: React.FC<InviteLinkProps> = ({ code, url }) => {
    const [inView, setInView] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const isCached = !!queryClient.getQueryData(['invites', 'details', code]);

    React.useEffect(() => {
        if (isCached || inView) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' },
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [isCached, inView]);

    const {
        data: invite,
        isLoading,
        error,
    } = useInviteDetails(code, {
        enabled: isCached || inView,
    });

    const { data: servers } = useServers();
    const joinServerMutation = useJoinServer();

    const [copied, setCopied] = React.useState(false);
    const { showToast } = useToast();

    const isJoined = servers?.some((s) => s._id === invite?.server.id);

    const handleCopy = (): void => {
        void navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        showToast('Copied the invite URL in to the clipboard!', 'success');
    };

    if (isLoading || (!isCached && !inView)) {
        return (
            <Box
                className="my-2 flex w-fit min-w-75 items-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary p-4"
                innerRef={containerRef}
            >
                <LoadingSpinner size="sm" />
                <Text size="sm" variant="muted">
                    Fetching invite details...
                </Text>
            </Box>
        );
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
        invite.server.banner?.type === 'image'
            ? resolveApiUrl(invite.server.banner.value)
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
            {bannerUrl && (
                <div className="h-20 w-full overflow-hidden bg-primary/10">
                    <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={bannerUrl}
                    />
                </div>
            )}

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
                            {invite.server.verified && (
                                <BadgeCheck
                                    className="shrink-0 text-primary"
                                    size={18}
                                    strokeWidth={2.5}
                                />
                            )}
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

                {invite.server.tags && invite.server.tags.length > 0 && (
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
                )}

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
