import type { ReactNode } from 'react';

import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
    useParams,
} from 'react-router-dom';

import { Text } from '@/ui/components/common/Text';
import { DevBotDetail } from '@/ui/components/developer/DevBotDetail';
import { DevBots } from '@/ui/components/developer/DevBots';
import { DevLayout } from '@/ui/components/developer/DevLayout';
import { DevSidebar } from '@/ui/components/developer/DevSidebar';

const DevBotDetailWrapper = (): ReactNode => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    if (!clientId) return <Navigate replace to="/developer/bots" />;
    return (
        <DevBotDetail
            clientId={clientId}
            onBack={(): undefined => void navigate('/developer/bots')}
        />
    );
};

export const Developer = (): ReactNode => {
    const location = useLocation();
    const navigate = useNavigate();

    const getTitle = (): string => {
        const path = location.pathname;
        if (path.startsWith('/developer/bots/')) return 'Bot Settings';
        if (path === '/developer/bots') return 'My Bots';
        if (path === '/developer/settings') return 'Developer Settings';
        return 'Developer Portal';
    };

    return (
        <DevLayout sidebar={<DevSidebar />} title={getTitle()}>
            <Routes>
                <Route element={<Navigate replace to="bots" />} path="/" />
                <Route
                    element={
                        <DevBots
                            onViewBot={(clientId): undefined =>
                                void navigate(`/developer/bots/${clientId}`)
                            }
                        />
                    }
                    path="bots"
                />
                <Route
                    element={<DevBotDetailWrapper />}
                    path="bots/:clientId"
                />

                <Route
                    element={
                        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle text-muted-foreground">
                            <Text as="p" size="lg" weight="medium">
                                Coming Soon
                            </Text>
                            <Text as="p" size="sm">
                                This section is under development.
                            </Text>
                        </div>
                    }
                    path="*"
                />
            </Routes>
        </DevLayout>
    );
};
