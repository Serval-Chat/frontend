import { type ReactNode, useState } from 'react';

import {
    BadgeCheck,
    Bot as BotIconLucide,
    Search,
    ShieldCheck,
    ShieldOff,
    Users,
    XCircle,
} from 'lucide-react';

import { ADMIN_CONSTANTS } from '@/constants/admin';
import {
    useAdminBots,
    useSetBotVerificationOverride,
} from '@/hooks/admin/useAdminBots';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/ui/components/common/Table';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { cn } from '@/utils/cn';

type AdminBotRowData = NonNullable<ReturnType<typeof useAdminBots>['data']>[number];

const AdminBotRow = ({
    bot,
    isSettingOverride,
    onSetOverride,
}: {
    bot: AdminBotRowData;
    isSettingOverride: boolean;
    onSetOverride: (args: {
        clientId: string;
        override: 'verified' | 'unverified' | null;
    }) => void;
}) => (
    <TableRow>
        <TableCell className="min-w-0">
            <div className="flex items-center gap-3 overflow-hidden">
                <UserProfilePicture
                    size="sm"
                    src={bot.profilePicture}
                    username={bot.username}
                />
                <div className="flex max-w-[150px] min-w-0 flex-col truncate md:max-w-[250px]">
                    <div className="flex min-w-0 items-center gap-1.5">
                        {bot.verified ? (
                            <BadgeCheck
                                className="shrink-0 text-primary"
                                size={16}
                                strokeWidth={2.5}
                            />
                        ) : null}
                        <span className="truncate font-bold text-foreground">
                            {bot.displayName || bot.username}
                        </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground opacity-60">
                        {bot.clientId}
                    </span>
                </div>
            </div>
        </TableCell>

        <TableCell>
            <div className="flex flex-wrap items-center gap-1.5">
                <div
                    className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                        bot.verified
                            ? 'bg-primary/10 text-primary'
                            : 'bg-bg-tertiary text-muted-foreground',
                    )}
                >
                    {bot.verified ? 'Yes' : 'No'}
                </div>
                {bot.verificationOverride ? (
                    <div className="bg-warning/10 text-warning inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                        Override
                    </div>
                ) : null}
                {!bot.verified && bot.verificationRequested ? (
                    <div className="inline-flex rounded-full bg-caution/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-caution uppercase">
                        Pending
                    </div>
                ) : null}
            </div>
        </TableCell>

        <TableCell className="min-w-0">
            {bot.owner ? (
                <div className="flex min-w-0 items-center gap-3">
                    <UserProfilePicture
                        size="sm"
                        src={bot.owner.profilePicture}
                        username={bot.owner.username}
                    />
                    <div className="flex min-w-0 flex-col truncate">
                        <span className="truncate text-sm font-medium">
                            {bot.owner.username}
                        </span>
                    </div>
                </div>
            ) : (
                <Text className="italic" color="danger" size="xs">
                    Unknown Owner
                </Text>
            )}
        </TableCell>

        <TableCell>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="opacity-40" size={14} />
                <span className="font-bold">{bot.serverCount}</span>
            </div>
        </TableCell>

        <TableCell align="right">
            <div className="flex justify-end gap-1">
                <Button
                    className="text-primary hover:bg-primary/10"
                    disabled={isSettingOverride}
                    size="sm"
                    title="Force Verified"
                    variant="ghost"
                    onClick={(): void => {
                        onSetOverride({
                            clientId: bot.clientId,
                            override: 'verified',
                        });
                    }}
                >
                    <ShieldCheck size={16} />
                </Button>
                <Button
                    className="text-danger hover:bg-danger/10"
                    disabled={isSettingOverride}
                    size="sm"
                    title="Force Unverified"
                    variant="ghost"
                    onClick={(): void => {
                        onSetOverride({
                            clientId: bot.clientId,
                            override: 'unverified',
                        });
                    }}
                >
                    <ShieldOff size={16} />
                </Button>
                {bot.verificationOverride ? (
                    <Button
                        disabled={isSettingOverride}
                        size="sm"
                        title="Clear Verification Override"
                        variant="ghost"
                        onClick={(): void => {
                            onSetOverride({
                                clientId: bot.clientId,
                                override: null,
                            });
                        }}
                    >
                        <XCircle size={16} />
                    </Button>
                ) : null}
            </div>
        </TableCell>
    </TableRow>
);

export const AdminBots = (): ReactNode => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const LIMIT = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE;
    const debouncedSearch = useDebounce(
        searchTerm,
        ADMIN_CONSTANTS.SEARCH_DEBOUNCE_MS,
    );
    const [lastSearch, setLastSearch] = useState(debouncedSearch);
    if (debouncedSearch !== lastSearch) {
        setLastSearch(debouncedSearch);
        setPage(0);
    }

    const {
        data: bots,
        isLoading,
        isError,
    } = useAdminBots(debouncedSearch, page, LIMIT);
    const { mutate: setVerificationOverride, isPending: isSettingOverride } =
        useSetBotVerificationOverride();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-700">
            <div className="flex flex-col gap-1">
                <Heading
                    className="flex items-center gap-3"
                    level={2}
                    variant="admin-page"
                >
                    <BotIconLucide className="text-primary" />
                    Bot Moderation
                </Heading>
                <Text as="p" variant="muted">
                    Monitor bots and manage their verified badge status.
                </Text>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-3">
                <div className="relative flex-1">
                    <Input
                        icon={<Search size={16} />}
                        placeholder="Search bots by name..."
                        size="admin"
                        type="text"
                        value={searchTerm}
                        variant="admin"
                        onChange={(e): void => {
                            setSearchTerm(e.target.value);
                        }}
                    />
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border-subtle bg-bg-secondary/50">
                        <TableHead>Bot</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Servers</TableHead>
                        <TableHead align="right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell align="center" colSpan={5}>
                                <div className="py-12">
                                    <LoadingSpinner size="lg" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : isError ? (
                        <TableRow>
                            <TableCell align="center" colSpan={5}>
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <Text className="text-destructive" weight="medium">
                                        Failed to load bots.
                                    </Text>
                                    <Text
                                        as="p"
                                        className="opacity-60"
                                        size="sm"
                                    >
                                        You may be missing the &quot;Manage
                                        bots&quot; permission.
                                    </Text>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : bots && bots.length > 0 ? (
                        bots.map((bot) => (
                            <AdminBotRow
                                bot={bot}
                                isSettingOverride={isSettingOverride}
                                key={bot.id}
                                onSetOverride={setVerificationOverride}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell align="center" colSpan={5}>
                                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                    <BotIconLucide
                                        className="mb-4 opacity-20"
                                        size={48}
                                    />
                                    <Text as="p" weight="medium">
                                        No bots found
                                    </Text>
                                    <Text
                                        as="p"
                                        className="opacity-60"
                                        size="sm"
                                    >
                                        Try searching for a different bot name
                                    </Text>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {!isLoading && bots && (bots.length > 0 || page > 0) ? (
                <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-subtle px-4 py-2">
                    <Button
                        disabled={page === 0}
                        variant="ghost"
                        onClick={(): void => {
                            setPage((p): number => Math.max(0, p - 1));
                        }}
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                        Page {page + 1}
                    </span>
                    <Button
                        disabled={bots.length < LIMIT}
                        variant="ghost"
                        onClick={(): void => {
                            setPage((p): number => p + 1);
                        }}
                    >
                        Next
                    </Button>
                </div>
            ) : null}
        </div>
    );
};
