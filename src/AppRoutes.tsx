import { lazy } from 'react';

import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminRoute } from '@/ui/components/layout/AdminRoute';
import { AuthenticatedLayout } from '@/ui/components/layout/AuthenticatedLayout';
import { NavigationSync } from '@/ui/components/layout/NavigationSync';

const Admin = lazy(() =>
    import('@/pages/Admin').then((m) => ({ default: m.Admin })),
);
const App = lazy(() => import('@/pages/App').then((m) => ({ default: m.App })));
const BotAuthorize = lazy(() =>
    import('@/pages/BotAuthorize').then((m) => ({ default: m.BotAuthorize })),
);
const Chat = lazy(() =>
    import('@/pages/Chat').then((m) => ({ default: m.Chat })),
);
const Developer = lazy(() =>
    import('@/pages/Developer').then((m) => ({ default: m.Developer })),
);
const Downloads = lazy(() =>
    import('@/pages/Downloads').then((m) => ({ default: m.Downloads })),
);
const EmbedBuilder = lazy(() =>
    import('@/pages/EmbedBuilder').then((m) => ({ default: m.EmbedBuilder })),
);
const ForgotPassword = lazy(() =>
    import('@/pages/ForgotPassword').then((m) => ({
        default: m.ForgotPassword,
    })),
);
const Invite = lazy(() =>
    import('@/pages/Invite').then((m) => ({ default: m.Invite })),
);
const Login = lazy(() =>
    import('@/pages/Login').then((m) => ({ default: m.Login })),
);
const NotFound = lazy(() =>
    import('@/pages/NotFound').then((m) => ({ default: m.NotFound })),
);
const Register = lazy(() =>
    import('@/pages/Register').then((m) => ({ default: m.Register })),
);
const ResetPassword = lazy(() =>
    import('@/pages/ResetPassword').then((m) => ({ default: m.ResetPassword })),
);
const Showoff = lazy(() =>
    import('@/pages/Showoff').then((m) => ({ default: m.Showoff })),
);
const TauriGateway = lazy(
    (): Promise<{ default: never } | { default: () => React.ReactElement }> =>
        import('@/pages/TauriGateway').then(
            (m): { default: () => React.ReactElement } => ({
                default: m.TauriGateway,
            }),
        ),
);
const Tos = lazy(() => import('@/pages/Tos').then((m) => ({ default: m.Tos })));

const isTauri = (): boolean => '__TAURI__' in globalThis;

const WebOnly = ({
    children,
}: {
    children: React.ReactNode;
}): React.ReactNode => {
    if (isTauri()) {
        console.warn(
            'WebOnly: Redirecting to /chat/@me because this is a desktop (Tauri) environment',
        );
        return <Navigate replace to="/chat/@me" />;
    }
    return children;
};

export const AppRoutes = (): React.ReactNode => (
    <Routes>
        <Route
            element={
                <WebOnly>
                    <App />
                </WebOnly>
            }
            path="/"
        />
        <Route element={<Login />} path="/login" />
        <Route element={<Invite />} path="/invite/:inviteId" />
        <Route element={<TauriGateway />} path="/gateway" />
        <Route
            element={
                <WebOnly>
                    <ForgotPassword />
                </WebOnly>
            }
            path="/forgot-password"
        />
        <Route
            element={
                <WebOnly>
                    <ResetPassword />
                </WebOnly>
            }
            path="/reset-password"
        />
        <Route
            element={
                <WebOnly>
                    <Register />
                </WebOnly>
            }
            path="/register"
        />
        <Route element={<Downloads />} path="/downloads" />
        <Route element={<Tos />} path="/tos" />
        <Route element={<AuthenticatedLayout />}>
            <Route element={<Chat />} path="/chat">
                <Route index element={<NavigationSync />} />
                <Route element={<NavigationSync />} path="@me" />
                <Route element={<NavigationSync />} path="@server/:serverId" />
                <Route
                    element={<NavigationSync />}
                    path="@server/:serverId/channel/:channelId"
                />
                <Route
                    element={<NavigationSync />}
                    path="@server/:serverId/self-roles"
                />
                <Route
                    element={<NavigationSync />}
                    path="@server/:serverId/channels-and-categories"
                />
                <Route
                    element={<NavigationSync />}
                    path="@server/:serverId/channel/:channelId/message/:messageId"
                />
                <Route element={<NavigationSync />} path="@user/:userId" />
                <Route
                    element={<NavigationSync />}
                    path="@user/:userId/message/:messageId"
                />
                <Route element={<NavigationSync />} path="@setting">
                    <Route element={<NavigationSync />} path="my-account" />
                    <Route element={<NavigationSync />} path="appearance" />
                    <Route element={<NavigationSync />} path="accessibility" />
                    <Route element={<NavigationSync />} path="standing" />
                    <Route element={<NavigationSync />} path="developer" />
                    <Route element={<NavigationSync />} path="blocking" />
                    <Route element={<NavigationSync />} path="notifications" />
                    <Route element={<NavigationSync />} path="keybinds" />
                    <Route element={<NavigationSync />} path="decorations" />
                    <Route element={<NavigationSync />} path="privacy" />
                </Route>
            </Route>
            <Route
                element={
                    <WebOnly>
                        <Showoff />
                    </WebOnly>
                }
                path="/showoff"
            />
            <Route element={<EmbedBuilder />} path="/embed-builder" />
        </Route>
        <Route element={<AdminRoute />}>
            <Route
                element={
                    <WebOnly>
                        <Admin />
                    </WebOnly>
                }
                path="/admin/*"
            />
        </Route>
        <Route element={<BotAuthorize />} path="/authorize" />
        <Route element={<Developer />} path="/developer/*" />
        <Route element={<NotFound />} path="*" />
    </Routes>
);
