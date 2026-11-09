import { useNavigate, useParams } from 'react-router-dom';

import { Pressable } from '@/ui/primitives/Pressable';

import { ServerMembersSettings } from './ServerMembersSettings';
import { ServerSubpageLayout } from './ServerSubpageLayout';

export const ServerMembersPage = () => {
    const { serverId } = useParams<{ serverId: string }>();
    const navigate = useNavigate();

    const handleBack = (): void => {
        void navigate(`/chat/@server/${serverId}`);
    };

    if (!serverId) return null;

    return (
        <ServerSubpageLayout>
            <Pressable
                aria-label="Back to server"
                className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
                onClick={handleBack}
            >
                ← Back
            </Pressable>
            <ServerMembersSettings serverId={serverId} />
        </ServerSubpageLayout>
    );
};
