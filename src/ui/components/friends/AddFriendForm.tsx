import React from 'react';

import { Plus } from 'lucide-react';

import { useSendFriendRequest } from '@/api/friends/friends.queries';
import { IconButton } from '@/ui/components/common/IconButton';
import { Input } from '@/ui/components/common/Input';
import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface AddFriendFormProps {
    className?: string;
    size?: 'sm' | 'md';
}

export const AddFriendForm: React.FC<AddFriendFormProps> = ({
    className,
    size = 'md',
}) => {
    const [username, setUsername] = React.useState('');
    const [status, setStatus] = React.useState<
        { type: 'success' | 'error'; message: string } | undefined
    >();
    const { mutate: sendFriendRequest, isPending } = useSendFriendRequest();

    const isSmall = size === 'sm';

    const submit = (): void => {
        if (!username.trim()) return;

        setStatus(undefined);
        sendFriendRequest(username, {
            onSuccess: () => {
                setUsername('');
                setStatus({ type: 'success', message: 'Friend request sent!' });
                setTimeout(() => setStatus(undefined), 3000);
            },
            onError: () => {
                setStatus({ type: 'error', message: 'Unknown error :p' });
            },
        });
    };

    return (
        <Box className={cn('relative flex flex-col gap-1', className)}>
            <Box className="flex gap-2">
                <Input
                    className={cn(
                        'bg-bg-tertiary border border-bg-subtle transition-all duration-200 focus:border-primary/50 focus:bg-bg-subtle',
                        isSmall ? 'h-8 text-xs' : 'h-10 text-sm',
                    )}
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        setStatus(undefined);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <IconButton
                    className={cn(
                        'shrink-0 border border-bg-subtle bg-bg-secondary p-0 transition-all duration-200 hover:border-primary/50 hover:bg-primary hover:text-foreground-inverse',
                        isSmall ? 'h-8 w-8' : 'h-10 w-10',
                    )}
                    disabled={isPending || !username}
                    icon={Plus}
                    iconSize={isSmall ? 16 : 20}
                    variant="normal"
                    onClick={submit}
                />
            </Box>

            {status && (
                <Box
                    className={cn(
                        'animate-in fade-in slide-in-from-top-1 absolute top-full left-0 mt-1 rounded px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg',
                        status.type === 'success'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400',
                    )}
                >
                    {status.message}
                </Box>
            )}
        </Box>
    );
};
