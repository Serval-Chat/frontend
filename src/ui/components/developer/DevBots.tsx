import { type ReactNode, useState } from 'react';

import { Plus } from 'lucide-react';

import { useBots, useCreateBot } from '@/hooks/developer/useBots';
import type { Bot } from '@/types/bot';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';

interface DevBotsProps {
    onViewBot: (clientId: string) => void;
}

const CreateBotModal = ({ onClose }: { onClose: () => void }): ReactNode => {
    const [name, setName] = useState('');
    const createBot = useCreateBot();

    const handleSubmit = (): void => {
        if (!name.trim()) return;
        createBot.mutate(
            { name: name.trim() },
            {
                onSuccess: (): void => {
                    onClose();
                },
            },
        );
    };

    return (
        <Modal isOpen title="Create a Bot" onClose={onClose}>
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-1">
                    <label
                        className="text-sm font-medium text-foreground"
                        htmlFor="bot-name"
                    >
                        Bot Name
                    </label>
                    <Input
                        id="bot-name"
                        placeholder="My Awesome Bot"
                        value={name}
                        onChange={(e): void => setName(e.target.value)}
                        onKeyDown={(e): void => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        loading={createBot.isPending}
                        variant="primary"
                        onClick={handleSubmit}
                    >
                        Create
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

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
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-subtle">
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
                    ID: {bot.clientId}
                </p>
            </div>
            <Button size="sm" variant="normal" onClick={onView}>
                Manage
            </Button>
        </div>
    );
};

export const DevBots = ({ onViewBot }: DevBotsProps): ReactNode => {
    const { data: bots, isLoading } = useBots();
    const [showCreate, setShowCreate] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {bots?.length ?? 0} bot{bots?.length !== 1 ? 's' : ''}{' '}
                    registered
                </p>
                <Button
                    icon={Plus}
                    size="sm"
                    variant="primary"
                    onClick={(): void => setShowCreate(true)}
                >
                    New Bot
                </Button>
            </div>

            {isLoading ? (
                <div className="flex flex-col gap-2">
                    {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
                        <div
                            className="h-20 animate-pulse rounded-xl bg-bg-secondary"
                            key={key}
                        />
                    ))}
                </div>
            ) : bots?.length ? (
                <div className="flex flex-col gap-2">
                    {bots.map((bot) => (
                        <BotCard
                            bot={bot}
                            key={bot.clientId}
                            onView={(): void => onViewBot(bot.clientId)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle text-center">
                    <p className="font-medium text-foreground">No bots yet</p>
                    <p className="text-sm text-muted-foreground">
                        Create your first bot to get started.
                    </p>
                </div>
            )}

            {showCreate && (
                <CreateBotModal onClose={(): void => setShowCreate(false)} />
            )}
        </div>
    );
};
