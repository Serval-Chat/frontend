import React from 'react';

import { Plus } from 'lucide-react';

import { useSendFriendRequest } from '@/api/friends/friends.queries';
import { IconButton } from '@/ui/components/common/IconButton';
import { Input } from '@/ui/components/common/Input';
import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Box } from '@/ui/components/layout/Box';

export const AddFriendForm: React.FC = () => {
    const [username, setUsername] = React.useState('');
    const [status, setStatus] = React.useState<
        { type: 'success' | 'error'; message: string } | undefined
    >();
    const { mutate: sendFriendRequest, isPending } = useSendFriendRequest();

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
        <>
            <Box className="flex gap-2 mb-2">
                <Input
                    className="bg-bg-tertiary border-none h-8"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        setStatus(undefined);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <IconButton
                    className="shrink-0 h-8 w-8 p-0 bg-bg-secondary border-none hover:bg-primary hover:text-foreground-inverse transition-all duration-200"
                    disabled={isPending || !username}
                    icon={Plus}
                    iconSize={16}
                    variant="normal"
                    onClick={submit}
                />
            </Box>

            <StatusMessage
                className="text-xs min-h-0 py-1.5"
                message={status?.message || ''}
                type={status?.type || 'error'}
            />
        </>
    );
};
