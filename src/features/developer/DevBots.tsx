import type { ReactNode } from 'react';

import { Plus } from 'lucide-react';

import { useBots } from '@/hooks/developer/useBots';
import type { Bot } from '@/types/bot';
import { Button } from '@/ui/primitives/Button';
import { Text } from '@/ui/primitives/Text';

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
        <div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-secondary p-4 transition-colors hover:border-border-subtle">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-subtle">
                {avatar ? (
                    <img
                        alt={name}
                        className="h-full w-full object-cover"
                        src={avatar}
                    />
                ) : (
                    <Text size="lg" variant="default" weight="bold">
                        {name[0]?.toUpperCase()}
                    </Text>
                )}
            </div>
            <div className="flex-1 overflow-hidden">
                <Text
                    as="p"
                    className="truncate"
                    variant="default"
                    weight="semibold"
                >
                    {name}
                </Text>
                <Text as="p" className="truncate" size="xs" variant="muted">
                    Client ID: {bot.clientId}
                </Text>
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
                    <Text as="p" variant="default" weight="medium">
                        Couldn&apos;t load your bots
                    </Text>
                    <Text as="p" size="sm" variant="muted">
                        Refresh the page to try again.
                    </Text>
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
                    <Text as="p" variant="default" weight="medium">
                        No bots yet
                    </Text>
                    <Text as="p" size="sm" variant="muted">
                        Create your first bot to get started.
                    </Text>
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
                <Text as="p" size="sm" variant="muted">
                    {bots?.length ?? 0} bot{bots?.length === 1 ? '' : 's'}{' '}
                    registered
                </Text>
            ) : null}
        </div>
    );
};
