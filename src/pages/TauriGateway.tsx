import type React from 'react';

import { Navigate } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';

export const TauriGateway = (): React.ReactElement => {
    const { data: user, isLoading } = useMe();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return <Navigate replace to="/login" />;
    }

    return <Navigate replace to="/chat/@me" />;
};
