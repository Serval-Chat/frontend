import React from 'react';

import { Plus } from 'lucide-react';

import { useSendFriendRequest } from '@/api/friends/friends.queries';
import { IconButton } from '@/ui/components/common/IconButton';
import { Input } from '@/ui/components/common/Input';
import { StatusMessage } from '@/ui/components/common/StatusMessage';

export const AddFriendForm: React.FC = () => {
    const [username, setUsername] = React.useState('');
    const [status, setStatus] = React.useState<
        { type: 'success' | 'error'; message: string } | undefined
    >();
    const { mutate: sendFriendRequest, isPending } = useSendFriendRequest();

    const submit = () => {
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
            <div className="flex gap-2 mb-2">
                <Input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        setStatus(undefined);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    className="bg-bg-tertiary border-none h-9"
                />
                <IconButton
                    icon={Plus}
                    iconSize={18}
                    onClick={submit}
                    disabled={isPending || !username}
                    className="shrink-0"
                />
            </div>

            <StatusMessage
                message={status?.message || ''}
                type={status?.type || 'error'}
                className="text-xs min-h-0 py-1.5"
            />
        </>
    );
};
