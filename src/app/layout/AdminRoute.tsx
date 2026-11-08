import type { ReactNode } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { SessionVerificationError } from '@/app/screens/SessionVerificationError';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/ui/primitives/LoadingSpinner';

export const AdminRoute = (): ReactNode => {
    const { isAuthenticated } = useAuth();
    const { data: user, isLoading, isError, isFetching, refetch } = useMe();

    if (!isAuthenticated) return <Navigate replace to="/login" />;

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
        return <LoadingSpinner size="lg" />;
    }

    // Check if user has any administrative permissions
    const permissions = user.permissions;
    const hasAdminAccess =
        permissions &&
        (permissions.adminAccess === true ||
            Object.values(permissions).includes(true));

    if (!hasAdminAccess) {
        console.warn(
            'AdminRoute: User does not have admin access, redirecting to /',
            {
                permissions,
            },
        );
        return <Navigate replace to="/" />;
    }

    return <Outlet />;
};
