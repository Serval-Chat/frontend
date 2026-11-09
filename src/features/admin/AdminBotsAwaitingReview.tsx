import { type ReactNode, useState } from 'react';

import { BadgeCheck, Check, Users, X } from 'lucide-react';

import { ADMIN_CONSTANTS } from '@/constants/admin';
import {
    useAdminAwaitingReviewBots,
    useDeclineBotVerification,
    useVerifyBot,
} from '@/features/admin/hooks/useAdminBots';
import { Button } from '@/ui/primitives/Button';
import { Heading } from '@/ui/primitives/Heading';
import { LoadingSpinner } from '@/ui/primitives/LoadingSpinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/ui/primitives/Table';
import { Text } from '@/ui/primitives/Text';
import { UserProfilePicture } from '@/features/users/UserProfilePicture';

type AwaitingBot = NonNullable<
    ReturnType<typeof useAdminAwaitingReviewBots>['data']
>['items'][number];

const AwaitingBotRow = ({
    bot,
    isBusy,
    onApprove,
    onDecline,
}: {
    bot: AwaitingBot;
    isBusy: boolean;
    onApprove: (clientId: string) => void;
    onDecline: (clientId: string) => void;
}) => (
    <TableRow>
        <TableCell className="min-w-0">
            <div className="flex items-center gap-3 overflow-hidden">
                <UserProfilePicture
                    size="sm"
                    src={bot.profilePicture}
                    username={bot.username}
                />
                <div className="flex min-w-0 flex-col truncate">
                    <Text className="truncate" variant="default" weight="bold">
                        {bot.displayName || bot.username}
                    </Text>
                    <Text className="font-mono text-[10px] opacity-60" variant="muted">
                        {bot.clientId}
                    </Text>
                </div>
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
                        <Text className="truncate" size="sm" weight="medium">
                            {bot.owner.username}
                        </Text>
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
                <Text weight="bold" >{bot.serverCount}</Text>
            </div>
        </TableCell>

        <TableCell align="right">
            <div className="flex justify-end gap-1">
                <Button
                    className="text-primary hover:bg-primary/10"
                    disabled={isBusy}
                    size="sm"
                    title="Approve Verification"
                    variant="ghost"
                    onClick={(): void => {
                        onApprove(bot.clientId);
                    }}
                >
                    <Check size={16} />
                </Button>
                <Button
                    className="text-danger hover:bg-danger/10"
                    disabled={isBusy}
                    size="sm"
                    title="Decline Verification"
                    variant="ghost"
                    onClick={(): void => {
                        onDecline(bot.clientId);
                    }}
                >
                    <X size={16} />
                </Button>
            </div>
        </TableCell>
    </TableRow>
);

export const AdminBotsAwaitingReview = (): ReactNode => {
    const [page, setPage] = useState(0);
    const LIMIT = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE;

    const { data, isLoading, isError } = useAdminAwaitingReviewBots(
        page,
        LIMIT,
    );
    const { mutate: verifyBot, isPending: isVerifying } = useVerifyBot();
    const { mutate: declineVerification, isPending: isDeclining } =
        useDeclineBotVerification();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-700">
            <div className="flex flex-col gap-1">
                <Heading
                    className="flex items-center gap-3"
                    level={2}
                    variant="admin-page"
                >
                    <BadgeCheck className="text-caution" />
                    Bot Verification Requests
                </Heading>
                <Text as="p" variant="muted">
                    Review bots that applied for the verified badge.
                </Text>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border-subtle bg-bg-secondary/50">
                        <TableHead>Bot</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Servers</TableHead>
                        <TableHead align="right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell align="center" colSpan={4}>
                                <div className="py-12">
                                    <LoadingSpinner size="lg" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : isError ? (
                        <TableRow>
                            <TableCell align="center" colSpan={4}>
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <Text className="text-danger" weight="medium">
                                        Failed to load verification requests.
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
                    ) : data?.items && data.items.length > 0 ? (
                        data.items.map((bot) => (
                            <AwaitingBotRow
                                bot={bot}
                                isBusy={isVerifying || isDeclining}
                                key={bot.id}
                                onApprove={verifyBot}
                                onDecline={declineVerification}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell align="center" colSpan={4}>
                                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                    <BadgeCheck
                                        className="mb-4 opacity-20"
                                        size={48}
                                    />
                                    <Text as="p" weight="medium">
                                        Queue is clear
                                    </Text>
                                    <Text
                                        as="p"
                                        className="opacity-60"
                                        size="sm"
                                    >
                                        No bots have applied for a verified
                                        badge.
                                    </Text>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {!isLoading && data && (data.items.length > 0 || page > 0) ? (
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
                    <Text size="sm" variant="muted" weight="medium" >
                        Page {page + 1}
                    </Text>
                    <Button
                        disabled={data.items.length < LIMIT}
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
