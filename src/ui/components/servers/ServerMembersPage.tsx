import { useNavigate, useParams } from 'react-router-dom';

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
            <button
                aria-label="Back to server"
                className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
                type="button"
                onClick={handleBack}
            >
                ← Back
            </button>
            <ServerMembersSettings serverId={serverId} />
        </ServerSubpageLayout>
    );
};
