import { useState } from 'react';

import type { LucideIcon } from 'lucide-react';
import {
    Check,
    HelpCircle,
    LogOut,
    Monitor,
    Pencil,
    Smartphone,
    Tablet,
    Trash2,
    X,
} from 'lucide-react';

import {
    useLogout,
    useRevokeOtherSessions,
    useRevokeSession,
    useSessions,
    useUpdateSessionIp,
} from '@/api/auth/auth.queries';
import { useMe, useUpdateSettings } from '@/api/users/users.queries';
import type { SessionDuration } from '@/api/users/users.types';
import { useIsDevelopment } from '@/hooks/useIsDevelopment';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Pill } from '@/ui/components/common/Pill';
import { Text } from '@/ui/components/common/Text';
import { Timestamp } from '@/ui/components/common/Timestamp';
import { useToast } from '@/ui/components/common/Toast';
import { Tooltip } from '@/ui/components/common/Tooltip';
import { extractApiError } from '@/utils/extractApiError';
import { parseUserAgent, type DeviceKind } from '@/utils/parseUserAgent';

const SESSION_DURATION_LABELS: Record<SessionDuration, string> = {
    '1d': '1 day',
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
};

const DEVICE_ICONS: Record<DeviceKind, LucideIcon> = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
};

const IP_RISK_LABELS: Record<'vpn' | 'datacenter', string> = {
    vpn: 'VPN',
    datacenter: 'Datacenter',
};

const toSeconds = (isoDate: string): number =>
    new Date(isoDate).getTime() / 1000;

export const ActiveSessionsSettings = () => {
    const { data: user } = useMe();
    const { data, isLoading } = useSessions();
    const { showToast } = useToast();
    const isDevelopment = useIsDevelopment();

    const { mutate: updateSettings } = useUpdateSettings();
    const { mutate: revokeSession, variables: revokingId } =
        useRevokeSession();
    const { mutate: revokeOthers, isPending: isRevokingOthers } =
        useRevokeOtherSessions();
    const { mutate: logout, isPending: isLoggingOut } = useLogout();
    const { mutate: updateSessionIp, isPending: isUpdatingIp } =
        useUpdateSessionIp();

    const [editingSessionId, setEditingSessionId] = useState<string | null>(
        null,
    );
    const [editIpValue, setEditIpValue] = useState('');

    const sessions = data?.sessions ?? [];
    const otherSessionCount = sessions.filter(
        (session) => !session.isCurrent,
    ).length;
    const sessionDuration = user?.settings?.sessionDuration ?? '30d';

    const startEditingIp = (sessionId: string, currentIp: string): void => {
        setEditingSessionId(sessionId);
        setEditIpValue(currentIp);
    };

    const cancelEditingIp = (): void => {
        setEditingSessionId(null);
        setEditIpValue('');
    };

    const confirmEditingIp = (sessionId: string): void => {
        updateSessionIp(
            { sessionId, ip: editIpValue },
            {
                onSuccess: (): void => {
                    setEditingSessionId(null);
                    setEditIpValue('');
                },
                onError: (error): void => {
                    showToast(
                        extractApiError(error, 'Failed to update session IP.'),
                        'error',
                    );
                },
            },
        );
    };

    const handleRevoke = (sessionId: string): void => {
        revokeSession(sessionId, {
            onError: (error): void => {
                showToast(
                    extractApiError(error, 'Failed to revoke session.'),
                    'error',
                );
            },
        });
    };

    const handleRevokeOthers = (): void => {
        revokeOthers(undefined, {
            onSuccess: (): void => {
                showToast('Other sessions signed out.', 'success');
            },
            onError: (error): void => {
                showToast(
                    extractApiError(error, 'Failed to sign out sessions.'),
                    'error',
                );
            },
        });
    };

    const handleLogout = (): void => {
        logout(undefined, {
            onError: (error): void => {
                showToast(
                    extractApiError(
                        error,
                        'Could not reach the server, but you have been signed out on this device.',
                    ),
                    'error',
                );
            },
        });
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <Heading className="mb-1" level={3}>
                        Sessions
                    </Heading>
                    <Text size="sm" variant="muted">
                        Devices currently signed in to your account.
                    </Text>
                </div>
                <Button
                    disabled={otherSessionCount === 0}
                    icon={LogOut}
                    loading={isRevokingOthers}
                    size="sm"
                    variant="danger"
                    onClick={handleRevokeOthers}
                >
                    Sign out other sessions
                </Button>
            </div>

            <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="flex flex-col gap-1">
                    <Text weight="bold">Stay signed in for</Text>
                    <Text size="xs" variant="muted">
                        How long a session lasts before you need to log in
                        again.
                    </Text>
                </div>
                <select
                    className="rounded-md border border-border-subtle bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                    value={sessionDuration}
                    onChange={(event): void => {
                        updateSettings({
                            sessionDuration: event.target
                                .value as SessionDuration,
                        });
                    }}
                >
                    {Object.entries(SESSION_DURATION_LABELS).map(
                        ([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ),
                    )}
                </select>
            </div>

            {isLoading ? (
                <Text size="sm" variant="muted">
                    Loading sessions...
                </Text>
            ) : (
                <div className="space-y-2">
                    {sessions.map((session) => {
                        const parsed = parseUserAgent(session.userAgent);
                        const DeviceIcon = DEVICE_ICONS[parsed.device];

                        return (
                            <div
                                className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-bg-subtle p-3"
                                key={session.id}
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <DeviceIcon
                                        className="shrink-0 text-text-muted"
                                        size={20}
                                    />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Text
                                                className="truncate"
                                                size="sm"
                                                weight="bold"
                                            >
                                                {parsed.label}
                                            </Text>
                                            {session.location !==
                                                undefined && (
                                                <span className="inline-flex min-w-0 items-center gap-1">
                                                    <Text
                                                        className="truncate"
                                                        size="xs"
                                                        variant="muted"
                                                    >
                                                        {session.location}
                                                    </Text>
                                                    <Tooltip
                                                        multiline
                                                        content={
                                                            "Approximate location based on this session's IP address.\nIt can be off, especially on mobile networks or with a VPN."
                                                        }
                                                        position="top"
                                                        triggerClassName="inline-flex items-center"
                                                    >
                                                        <HelpCircle
                                                            className="shrink-0 text-muted-foreground"
                                                            size={12}
                                                        />
                                                    </Tooltip>
                                                </span>
                                            )}
                                            {session.ipRisk !==
                                                undefined && (
                                                <Tooltip
                                                    multiline
                                                    content={
                                                        session.ipRisk ===
                                                        'vpn'
                                                            ? "This session's IP belongs to a known VPN provider."
                                                            : "This session's IP belongs to a datacenter or hosting provider, not a typical home network."
                                                    }
                                                    position="top"
                                                    triggerClassName="inline-flex items-center"
                                                >
                                                    <Pill variant="caution">
                                                        {IP_RISK_LABELS[
                                                            session.ipRisk
                                                        ]}
                                                    </Pill>
                                                </Tooltip>
                                            )}
                                            {session.isCurrent && (
                                                <Pill variant="success">
                                                    This device
                                                </Pill>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                            {editingSessionId ===
                                            session.id ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <input
                                                        className="h-5 w-28 rounded border border-border-subtle bg-background px-1 text-[11px] text-foreground outline-none focus:border-primary"
                                                        value={editIpValue}
                                                        onChange={(
                                                            event,
                                                        ): void => {
                                                            setEditIpValue(
                                                                event.target
                                                                    .value,
                                                            );
                                                        }}
                                                        onKeyDown={(
                                                            event,
                                                        ): void => {
                                                            if (
                                                                event.key ===
                                                                'Enter'
                                                            ) {
                                                                confirmEditingIp(
                                                                    session.id,
                                                                );
                                                            }
                                                            if (
                                                                event.key ===
                                                                'Escape'
                                                            ) {
                                                                cancelEditingIp();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-success/10 hover:text-success disabled:cursor-not-allowed disabled:opacity-50"
                                                        disabled={
                                                            isUpdatingIp
                                                        }
                                                        type="button"
                                                        onClick={(): void => {
                                                            confirmEditingIp(
                                                                session.id,
                                                            );
                                                        }}
                                                    >
                                                        <Check size={10} />
                                                    </button>
                                                    <button
                                                        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                                                        type="button"
                                                        onClick={
                                                            cancelEditingIp
                                                        }
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1">
                                                    {session.ip}
                                                    {isDevelopment && (
                                                        <button
                                                            className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
                                                            type="button"
                                                            onClick={(): void => {
                                                                startEditingIp(
                                                                    session.id,
                                                                    session.ip,
                                                                );
                                                            }}
                                                        >
                                                            <Pencil
                                                                size={10}
                                                            />
                                                        </button>
                                                    )}
                                                </span>
                                            )}
                                            <span>
                                                · logged in{' '}
                                                <Timestamp
                                                    className="rounded-none bg-transparent p-0 text-xs font-normal text-muted-foreground"
                                                    flag="R"
                                                    timestamp={toSeconds(
                                                        session.createdAt,
                                                    )}
                                                />{' '}
                                                · last active{' '}
                                                <Timestamp
                                                    className="rounded-none bg-transparent p-0 text-xs font-normal text-muted-foreground"
                                                    flag="R"
                                                    timestamp={toSeconds(
                                                        session.lastSeenAt,
                                                    )}
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {session.isCurrent ? (
                                    <Button
                                        icon={LogOut}
                                        loading={isLoggingOut}
                                        size="sm"
                                        variant="danger"
                                        onClick={handleLogout}
                                    >
                                        Log out
                                    </Button>
                                ) : (
                                    <Button
                                        icon={Trash2}
                                        loading={revokingId === session.id}
                                        size="sm"
                                        variant="ghost"
                                        onClick={(): void => {
                                            handleRevoke(session.id);
                                        }}
                                    >
                                        Revoke
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
