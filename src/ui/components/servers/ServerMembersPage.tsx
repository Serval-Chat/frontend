import { useNavigate, useParams } from 'react-router-dom';

import { Box } from '@/ui/components/layout/Box';

import { ServerMembersSettings } from './ServerMembersSettings';

export const ServerMembersPage = () => {
    const { serverId } = useParams<{ serverId: string }>();
    const navigate = useNavigate();

    const handleBack = (): void => {
        void navigate(`/chat/@server/${serverId}`);
    };

    if (!serverId) return null;

    return (
        <Box className="chat-background relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <Box className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-10">
                <button
                    aria-label="Back to server"
                    className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
                    type="button"
                    onClick={handleBack}
                >
                    ← Back
                </button>
                <ServerMembersSettings serverId={serverId} />
            </Box>
        </Box>
    );
};
