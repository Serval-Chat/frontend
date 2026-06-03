import { type ReactNode, useState } from 'react';

import {
    AlertTriangle,
    Check,
    ChevronDown,
    CircleOff,
    ExternalLink,
    Server,
    Shield,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useServers } from '@/api/servers/servers.queries';
import { useMe } from '@/api/users/users.queries';
import { useAuthorizeBot, usePublicBotInfo } from '@/hooks/developer/useBots';
import { BOT_PERMISSION_KEYS } from '@/types/bot';
import type { BotPermissionKey } from '@/types/bot';
import { Button } from '@/ui/components/common/Button';
import { Divider } from '@/ui/components/common/Divider';
import { Heading } from '@/ui/components/common/Heading';
import { MutedText } from '@/ui/components/common/MutedText';
import { Skeleton } from '@/ui/components/common/Skeleton';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { UserProfilePictureIcon } from '@/ui/components/common/UserProfilePictureIcon';
import { Box } from '@/ui/components/layout/Box';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';
import { ProfileBanner } from '@/ui/components/profile/ProfileBanner';
import {
    BOT_PERMISSION_LABELS,
    bitmaskToPermissions,
} from '@/utils/botPermissions';
import { cn } from '@/utils/cn';
import { APP_LOCALE } from '@/utils/locale';

const BotBannerHeader = ({
    username,
    displayName,
    profilePicture,
    banner,
    usernameGradient,
    loading,
}: {
    username: string;
    displayName?: string;
    profilePicture?: string;
    banner?: string;
    usernameGradient?: { colors: string[] };
    loading?: boolean;
}): ReactNode => (
    <div className="relative w-full">
        <ProfileBanner
            alt={displayName ?? username}
            banner={banner}
            className="rounded-t-lg"
            height={140}
            usernameGradient={usernameGradient}
        />
        {loading && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-t-lg" />
        )}

        <div className="absolute bottom-0 left-1/2 z-content -translate-x-1/2 translate-y-1/2">
            {loading ? (
                <Skeleton
                    className="h-20 w-20 rounded-full ring-4 ring-bg-subtle"
                    variant="rectangular"
                />
            ) : (
                <div className="relative">
                    <div className="rounded-full bg-bg-subtle ring-4 ring-bg-subtle">
                        <UserProfilePictureIcon
                            size="xl"
                            src={profilePicture}
                            username={displayName ?? username}
                        />
                    </div>
                </div>
            )}
        </div>
    </div>
);

const InvalidBot = (): ReactNode => (
    <div className="relative z-content space-y-4 text-center">
        <div className="flex justify-center text-muted-foreground/50">
            <CircleOff size={64} strokeWidth={1.5} />
        </div>
        <Heading variant="page">Bot Not Found</Heading>
        <Text as="p" className="text-muted-foreground">
            This bot application does not exist or the link is invalid.
        </Text>
        <Link className="mt-2 inline-block text-sm font-medium" to="/">
            Go back home
        </Link>
    </div>
);

const SuccessCard = ({
    botName,
    serverName,
    serverId,
}: {
    botName: string;
    serverName: string;
    serverId: string;
}): ReactNode => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center gap-5 py-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
                <Check className="text-primary" size={28} />
            </div>
            <div>
                <Heading variant="page">{botName} added!</Heading>
                <MutedText className="mt-1 text-sm">
                    Bot is now a member of{' '}
                    <strong className="text-foreground">{serverName}</strong>.
                </MutedText>
            </div>
            <Button
                className="w-full py-3 text-base font-semibold"
                variant="primary"
                onClick={(): undefined =>
                    void navigate(`/chat/@server/${serverId}`)
                }
            >
                <ExternalLink size={14} /> Go to Server
            </Button>
        </div>
    );
};

export const BotAuthorize = (): ReactNode => {
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();

    const clientId = searchParams.get('client_id') ?? '';

    const {
        data: botInfo,
        isLoading: botLoading,
        isError: botError,
    } = usePublicBotInfo(clientId);
    const { data: user } = useMe();
    const { data: servers, isLoading: serversLoading } = useServers();
    const { mutate: authorize, isPending } = useAuthorizeBot();

    const [selectedServerId, setSelectedServerId] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [success, setSuccess] = useState<{
        serverName: string;
        serverId: string;
    } | null>(null);

    const showSkeleton = botLoading || !clientId;
    const showError = (botError || !clientId) && !botLoading;

    const permissionsBitmask = searchParams.get('permissions');
    const urlPermissions = permissionsBitmask
        ? bitmaskToPermissions(parseInt(permissionsBitmask, 10))
        : null;

    const botName = botInfo?.displayName ?? botInfo?.username ?? '';
    const activePermissions = urlPermissions ?? botInfo?.botPermissions;
    const requestedPerms = activePermissions
        ? BOT_PERMISSION_KEYS.filter(
              (k): boolean | undefined => activePermissions[k],
          )
        : [];

    const manageableServers =
        servers?.filter((s): boolean | undefined => s.canManage) ?? [];
    const selectedServer = manageableServers.find(
        (s): boolean => s.id === selectedServerId,
    );

    const handleAuthorize = (): void => {
        if (!selectedServerId) {
            showToast('Select a server first', 'error');
            return;
        }
        authorize(
            {
                clientId,
                serverId: selectedServerId,
                permissions: permissionsBitmask
                    ? parseInt(permissionsBitmask, 10)
                    : undefined,
            },
            {
                onSuccess: ({ serverName, serverId }): void => {
                    setSuccess({ serverName, serverId });
                },
                onError: (e): void =>
                    showToast(e.message || 'Authorization failed', 'error'),
            },
        );
    };

    return (
        <Box className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4">
            <DefaultBackground />

            {showError ? (
                <InvalidBot />
            ) : success ? (
                <div className="relative z-content w-full max-w-sm rounded-lg border border-border-subtle bg-bg-subtle px-6 py-8 shadow-lg">
                    <SuccessCard
                        botName={botName}
                        serverId={success.serverId}
                        serverName={success.serverName}
                    />
                </div>
            ) : (
                <div className="relative z-content flex w-full max-w-sm flex-col overflow-visible rounded-lg border border-border-subtle bg-bg-subtle shadow-lg">
                    <BotBannerHeader
                        banner={botInfo?.banner}
                        displayName={botInfo?.displayName}
                        loading={showSkeleton}
                        profilePicture={botInfo?.profilePicture}
                        username={botInfo?.username ?? ''}
                        usernameGradient={botInfo?.usernameGradient}
                    />

                    <div className="flex flex-col items-center gap-4 px-6 pt-14 pb-6 text-center">
                        {showSkeleton ? (
                            <Skeleton className="h-7 w-40" variant="text" />
                        ) : (
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Heading
                                        className="text-xl leading-tight"
                                        variant="page"
                                    >
                                        {botName}
                                    </Heading>
                                    <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-primary/80 uppercase">
                                        BOT
                                    </span>
                                </div>
                                <Text
                                    as="p"
                                    className="font-mono text-xs text-muted-foreground/60"
                                >
                                    @{botInfo?.username}
                                </Text>
                            </div>
                        )}

                        {showSkeleton ? (
                            <Skeleton className="h-4 w-28" variant="text" />
                        ) : (
                            <MutedText className="flex items-center gap-1.5 text-sm">
                                <Server className="opacity-60" size={13} />
                                {botInfo!.serverCount === 0
                                    ? 'Not in any servers yet'
                                    : `In ${botInfo!.serverCount.toLocaleString(APP_LOCALE)} ${botInfo!.serverCount === 1 ? 'server' : 'servers'}`}
                            </MutedText>
                        )}

                        {!showSkeleton && botInfo?.bio && (
                            <Text
                                as="p"
                                className="max-w-xs text-sm text-muted-foreground"
                            >
                                {botInfo.bio}
                            </Text>
                        )}

                        {!showSkeleton && requestedPerms.length > 0 && (
                            <>
                                <Divider />
                                <div className="w-full text-left">
                                    <div className="mb-2.5 flex items-center gap-1.5">
                                        <Shield
                                            className="text-muted-foreground/60"
                                            size={13}
                                        />
                                        <Text
                                            as="p"
                                            className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                                        >
                                            Requested permissions
                                        </Text>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {requestedPerms.map(
                                            (key: BotPermissionKey) => (
                                                <span
                                                    className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-secondary/50 px-2.5 py-2 text-xs font-medium"
                                                    key={key}
                                                >
                                                    <Check
                                                        className="shrink-0 text-primary"
                                                        size={11}
                                                    />
                                                    {BOT_PERMISSION_LABELS[key]}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <Divider />

                        <div className="w-full space-y-2">
                            <Text
                                as="p"
                                className="text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                            >
                                Add to server
                            </Text>

                            {!user ? (
                                <div className="flex items-start gap-2.5 rounded-lg border border-caution/20 bg-caution/5 px-3.5 py-3 text-left text-sm">
                                    <AlertTriangle
                                        className="mt-0.5 shrink-0 text-caution"
                                        size={15}
                                    />
                                    <span className="text-muted-foreground">
                                        You must be{' '}
                                        <Link
                                            className="font-semibold text-primary underline-offset-2 hover:underline"
                                            to={`/login?redirect=/authorize?client_id=${clientId}`}
                                        >
                                            signed in
                                        </Link>{' '}
                                        to add this bot.
                                    </span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <button
                                        className={cn(
                                            'flex w-full items-center justify-between gap-3 rounded-lg border border-border-subtle bg-bg-secondary/30 px-3.5 py-2.5 text-left transition-colors hover:bg-bg-secondary/50',
                                            dropdownOpen &&
                                                'border-primary/40 bg-bg-secondary/50',
                                        )}
                                        type="button"
                                        onClick={(): void =>
                                            setDropdownOpen((o): boolean => !o)
                                        }
                                    >
                                        {selectedServer ? (
                                            <div className="flex items-center gap-2.5">
                                                {selectedServer.icon ? (
                                                    <img
                                                        alt={
                                                            selectedServer.name
                                                        }
                                                        className="h-6 w-6 rounded-full object-cover"
                                                        src={
                                                            selectedServer.icon
                                                        }
                                                    />
                                                ) : (
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-secondary text-[10px] font-bold">
                                                        {selectedServer.name[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <Text
                                                    as="span"
                                                    size="sm"
                                                    weight="bold"
                                                >
                                                    {selectedServer.name}
                                                </Text>
                                            </div>
                                        ) : (
                                            <Text
                                                as="span"
                                                size="sm"
                                                variant="muted"
                                            >
                                                {serversLoading
                                                    ? 'Loading…'
                                                    : manageableServers.length ===
                                                        0
                                                      ? 'No servers available'
                                                      : 'Select a server'}
                                            </Text>
                                        )}
                                        <ChevronDown
                                            className={cn(
                                                'shrink-0 text-muted-foreground transition-transform duration-200',
                                                dropdownOpen && 'rotate-180',
                                            )}
                                            size={15}
                                        />
                                    </button>

                                    {dropdownOpen &&
                                        manageableServers.length > 0 && (
                                            <div className="absolute top-full left-0 z-[200] mt-1 w-full overflow-hidden rounded-lg border border-border-subtle bg-background shadow-xl">
                                                <div className="custom-scrollbar max-h-52 overflow-y-auto">
                                                    {manageableServers.map(
                                                        (server) => (
                                                            <button
                                                                className={cn(
                                                                    'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-bg-secondary/50',
                                                                    selectedServerId ===
                                                                        server.id &&
                                                                        'bg-primary/10',
                                                                )}
                                                                key={server.id}
                                                                type="button"
                                                                onClick={(): void => {
                                                                    setSelectedServerId(
                                                                        server.id,
                                                                    );
                                                                    setDropdownOpen(
                                                                        false,
                                                                    );
                                                                }}
                                                            >
                                                                {server.icon ? (
                                                                    <img
                                                                        alt={
                                                                            server.name
                                                                        }
                                                                        className="h-6 w-6 rounded-full object-cover"
                                                                        src={
                                                                            server.icon
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-secondary text-[10px] font-bold">
                                                                        {server.name[0].toUpperCase()}
                                                                    </div>
                                                                )}
                                                                <span className="flex-1">
                                                                    {
                                                                        server.name
                                                                    }
                                                                </span>
                                                                {selectedServerId ===
                                                                    server.id && (
                                                                    <Check
                                                                        className="text-primary"
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                )}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>

                        {user && (
                            <MutedText className="text-xs">
                                Authorizing as{' '}
                                <strong className="text-foreground">
                                    @{user.username}
                                </strong>
                            </MutedText>
                        )}

                        {showSkeleton ? (
                            <Skeleton className="h-10 w-full rounded-md" />
                        ) : (
                            <Button
                                className="mt-1 w-full py-3 text-base font-semibold"
                                disabled={
                                    !selectedServerId || isPending || !user
                                }
                                loading={isPending}
                                variant="primary"
                                onClick={handleAuthorize}
                            >
                                Authorize
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Box>
    );
};
