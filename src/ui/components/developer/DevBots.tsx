import type { ReactNode } from 'react';

import { Plus } from 'lucide-react';

import { useBots } from '@/hooks/developer/useBots';
import type { Bot } from '@/types/bot';
import { Button } from '@/ui/components/common/Button';

interface DevBotsProps {
    onCreateBot: () => void;
    onViewBot: (clientId: string) => void;
}

const BotCard = ({
    bot,
    onView,
}: {
    bot: Bot;
    onView: () => void;
}): ReactNode => {
    const user = typeof bot.userId === 'object' ? bot.userId : bot.user;
    const name = user?.displayName ?? user?.username ?? 'Unknown Bot';
    const avatar = user?.profilePicture;

    return (
        <div className="hover:border-border flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-secondary p-4 transition-colors">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-subtle">
                {avatar ? (
                    <img
                        alt={name}
                        className="h-full w-full object-cover"
                        src={avatar}
                    />
                ) : (
                    <span className="text-lg font-bold text-foreground">
                        {name[0]?.toUpperCase()}
                    </span>
                )}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="truncate font-semibold text-foreground">{name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    Client ID: {bot.clientId}
                </p>
            </div>
            <Button size="sm" variant="normal" onClick={onView}>
                Manage
            </Button>
        </div>
    );
};

export const DevBots = ({
    onCreateBot,
    onViewBot,
}: DevBotsProps): ReactNode => {
    const { data: bots, isError, isLoading } = useBots();

    return (
        <div className="flex flex-col gap-4">
            {isError ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle text-center">
                    <p className="font-medium text-foreground">
                        Couldn&apos;t load your bots
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Refresh the page to try again.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
                        <div
                            className="h-20 animate-pulse rounded-xl bg-bg-secondary"
                            key={key}
                        />
                    ))}
                </div>
            ) : bots?.length ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {bots.map((bot) => (
                        <BotCard
                            bot={bot}
                            key={bot.clientId}
                            onView={(): void => {
                                onViewBot(bot.clientId);
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle text-center">
                    <p className="font-medium text-foreground">No bots yet</p>
                    <p className="text-sm text-muted-foreground">
                        Create your first bot to get started.
                    </p>
                    <Button
                        className="mt-3"
                        icon={Plus}
                        size="sm"
                        variant="normal"
                        onClick={onCreateBot}
                    >
                        New Bot
                    </Button>
                </div>
            )}

            {!isLoading && !isError ? (
                <p className="text-sm text-muted-foreground">
                    {bots?.length ?? 0} bot{bots?.length === 1 ? '' : 's'}{' '}
                    registered
                </p>
            ) : null}
        </div>
    );
};
