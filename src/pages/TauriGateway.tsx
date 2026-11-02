import type React from 'react';

import { Navigate } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { SessionVerificationError } from '@/ui/components/common/SessionVerificationError';

export const TauriGateway = (): React.ReactElement => {
    const { isAuthenticated } = useAuth();
    const { data: user, isLoading, isError, isFetching, refetch } = useMe();

    if (!isAuthenticated) {
        return <Navigate replace to="/login" />;
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user) {
        if (isError) {
            return (
                <SessionVerificationError
                    isRetrying={isFetching}
                    onRetry={(): void => {
                        void refetch();
                    }}
                />
            );
        }
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return <Navigate replace to="/chat/@me" />;
};
