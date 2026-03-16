import { type ReactNode } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import { useMe } from '@/api/users/users.queries';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';

export const AdminRoute = (): ReactNode => {
    const { data: user, isLoading } = useMe();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user) {
        console.warn('AdminRoute: No user found, redirecting to /login');
        return <Navigate replace to="/login" />;
    }

    // Check if user has any administrative permissions
    const permissions = user.permissions;
    const hasAdminAccess =
        permissions &&
        (permissions.adminAccess === true ||
            Object.values(permissions).some((val) => val === true));

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
