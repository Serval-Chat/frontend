import { type ReactNode, useState } from 'react';

import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import {
    useAdminBansList,
    useAdminMutesList,
    useAdminUnbanUser,
    useAdminUnmuteUser,
} from '@/hooks/admin/useAdminBans';
import { Button } from '@/ui/components/common/Button';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Text } from '@/ui/components/common/Text';

export const AdminBansAndMutes = (): ReactNode => {
    const [activeTab, setActiveTab] = useState<'bans' | 'mutes'>('bans');

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <Text as="div" size="2xl" weight="bold">
                    Bans & Mutes
                </Text>
                <Text as="p" className="text-muted-foreground">
                    Manage globally banned and muted users across the platform.
                </Text>
            </div>

            <div className="flex gap-4 border-b border-border-subtle pb-4">
                <Button
                    variant={activeTab === 'bans' ? 'primary' : 'normal'}
                    onClick={() => setActiveTab('bans')}
                >
                    Active Bans
                </Button>
                <Button
                    variant={activeTab === 'mutes' ? 'primary' : 'normal'}
                    onClick={() => setActiveTab('mutes')}
                >
                    Active Mutes
                </Button>
            </div>

            <div className="flex flex-col gap-4">
                {activeTab === 'bans' ? <BansList /> : <MutesList />}
            </div>
        </div>
    );
};

const BansList = (): ReactNode => {
    const { data: bans, isLoading, isError } = useAdminBansList();
    const { mutate: unbanUser, isPending: isUnbanning } = useAdminUnbanUser();
    const navigate = useNavigate();

    if (isLoading) return <LoadingSpinner />;
    if (isError)
        return <Text className="text-destructive">Failed to load bans.</Text>;

    if (!bans || bans.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border-subtle">
                <Text className="text-muted-foreground">
                    No active bans found.
                </Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bans.map((ban) => (
                    <div
                        className="bg-background-subtle flex flex-col gap-3 rounded-xl border border-border-subtle p-4"
                        key={ban._id}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                                <Text
                                    className="cursor-pointer text-primary hover:underline"
                                    weight="semibold"
                                    onClick={() =>
                                        void navigate(
                                            `/admin/users/${ban.userId}`,
                                        )
                                    }
                                >
                                    User ID:{' '}
                                    {ban.userId
                                        ? `${ban.userId.slice(0, 8)}...`
                                        : 'Unknown'}
                                </Text>
                                <Text
                                    className="text-muted-foreground"
                                    size="sm"
                                >
                                    Issued by:{' '}
                                    {ban.issuedBy
                                        ? `${ban.issuedBy.slice(0, 8)}...`
                                        : 'System'}
                                </Text>
                            </div>
                        </div>
                        <Text
                            className="line-clamp-2 text-muted-foreground italic"
                            size="sm"
                        >
                            "{ban.reason}"
                        </Text>
                        <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2">
                            <Text className="text-muted-foreground" size="xs">
                                Expires:{' '}
                                {ban.expirationTimestamp
                                    ? format(
                                          new Date(ban.expirationTimestamp),
                                          'PPP',
                                      )
                                    : 'Permanent'}
                            </Text>
                            <Button
                                disabled={isUnbanning}
                                size="sm"
                                variant="danger"
                                onClick={() => unbanUser(ban.userId)}
                            >
                                Unban
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MutesList = (): ReactNode => {
    const { data: mutes, isLoading, isError } = useAdminMutesList();
    const { mutate: unmuteUser, isPending: isUnmuting } = useAdminUnmuteUser();
    const navigate = useNavigate();

    if (isLoading) return <LoadingSpinner />;
    if (isError)
        return <Text className="text-destructive">Failed to load mutes.</Text>;

    if (!mutes || mutes.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border-subtle">
                <Text className="text-muted-foreground">
                    No active mutes found.
                </Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mutes.map((mute) => (
                    <div
                        className="bg-background-subtle flex flex-col gap-3 rounded-xl border border-border-subtle p-4"
                        key={mute._id}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                                <Text
                                    className="cursor-pointer text-primary hover:underline"
                                    weight="semibold"
                                    onClick={() =>
                                        void navigate(
                                            `/admin/users/${mute.userId}`,
                                        )
                                    }
                                >
                                    User ID:{' '}
                                    {mute.userId
                                        ? `${mute.userId.slice(0, 8)}...`
                                        : 'Unknown'}
                                </Text>
                                <Text
                                    className="text-muted-foreground"
                                    size="sm"
                                >
                                    Issued by:{' '}
                                    {mute.issuedBy
                                        ? `${mute.issuedBy.slice(0, 8)}...`
                                        : 'System'}
                                </Text>
                            </div>
                        </div>
                        <Text
                            className="line-clamp-2 text-muted-foreground italic"
                            size="sm"
                        >
                            "{mute.reason}"
                        </Text>
                        <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2">
                            <Text className="text-muted-foreground" size="xs">
                                Expires:{' '}
                                {mute.expirationTimestamp
                                    ? format(
                                          new Date(mute.expirationTimestamp),
                                          'PPP',
                                      )
                                    : 'Permanent'}
                            </Text>
                            <Button
                                disabled={isUnmuting}
                                size="sm"
                                variant="danger"
                                onClick={() => unmuteUser(mute.userId)}
                            >
                                Unmute
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
