import * as Sentry from '@sentry/react';
import { Bug, KeyRound, Server } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    toggleConsole,
    toggleUsernameColorResolverContextMenu,
} from '@/store/slices/debugOptionsSlice';
import { toggleFurTweaker } from '@/store/slices/furTweakerSlice';
import { toggleThemeTweaker } from '@/store/slices/themeTweakerSlice';
import { Button } from '@/ui/primitives/Button';
import { CopyInput } from '@/ui/primitives/CopyInput';
import { Heading } from '@/ui/primitives/Heading';
import { Link } from '@/ui/primitives/Link';
import { Text } from '@/ui/primitives/Text';
import { Toggle } from '@/ui/primitives/Toggle';
import { colors } from '@/ui/theme';
import { getAuthToken } from '@/utils/authToken';
import { censorToken } from '@/utils/censorToken';
import { toggleWsDebugWindow, useWsDebugWindowOpen } from '@/ws/debug';

const crashFrontend = async (): Promise<void> => {
    const error = new Error(
        `Manual frontend crash from Developer Settings (${new Date().toISOString()})`,
    );

    Sentry.captureException(error);
    await Sentry.flush(2000);

    setTimeout(() => {
        throw error;
    }, 0);
};

export const DeveloperSettings = () => {
    const dispatch = useAppDispatch();
    const isWsWindowOpen = useWsDebugWindowOpen();
    const isFurTweakerOpen = useAppSelector(
        (state): boolean => state.furTweaker.isOpen,
    );
    const isThemeTweakerOpen = useAppSelector(
        (state): boolean => state.themeTweaker.isOpen,
    );
    const usernameColorResolverContextMenu = useAppSelector(
        (state): boolean =>
            state.debugOptions?.usernameColorResolverContextMenu ?? false,
    );
    const isConsoleOpen = useAppSelector(
        (state): boolean => state.debugOptions?.isConsoleOpen ?? false,
    );
    const backendInstanceId = useAppSelector(
        (state): string | null => state.presence.backendInstanceId,
    );

    const token = getAuthToken();

    return (
        <div className="flex min-h-full flex-col gap-6">
            <div>
                <Heading level={2} variant="section">
                    Developer Parameters
                </Heading>
                <Text as="p" className="mt-1" size="sm" variant="muted">
                    (Not) Advanced debugging tools and logs.
                </Text>
            </div>

            {import.meta.env.DEV && (
                <Link
                    className="rounded-md border border-border-subtle bg-bg-subtle p-4 text-sm font-semibold hover:bg-bg-secondary"
                    href="/wcag-reporter"
                >
                    Open WCAG Reporter
                </Link>
            )}

            <div className="flex flex-col gap-4">
                {backendInstanceId ? (
                    <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-bg-subtle p-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <Server size={18} />
                                Backend Instance
                            </div>
                            <Text size="sm" variant="muted">
                                Instance serving your current connection.
                            </Text>
                        </div>
                        <CopyInput
                            readOnly
                            aria-label="Backend instance ID"
                            copyLabel="Copy instance ID"
                            copyValue={backendInstanceId}
                            size="sm"
                            style={{
                                backgroundColor: colors.background,
                                fontFamily: 'var(--font-mono)',
                            }}
                            value={backendInstanceId}
                        />
                    </div>
                ) : null}

                {/* User Token */}
                <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-bg-subtle p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                            <KeyRound size={18} />
                            User Token
                        </div>
                        <Text size="sm" variant="muted">
                            Your session token in case you use a custom client.
                            Do not share this ANYWHERE and do not send it to
                            anyone.
                        </Text>
                    </div>
                    <CopyInput
                        readOnly
                        aria-label="User token (censored)"
                        copyLabel="Copy token"
                        copyValue={token}
                        size="sm"
                        style={{
                            backgroundColor: colors.background,
                            fontFamily: 'var(--font-mono)',
                        }}
                        value={token !== null ? censorToken(token) : '-'}
                    />
                </div>

                <div className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-subtle p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                            <Bug size={18} />
                            WebSocket Logger
                        </div>
                        <Text size="sm" variant="muted">
                            Open floating window to vuew all real-time events.
                        </Text>
                    </div>
                    <Button
                        variant={isWsWindowOpen ? 'danger' : 'primary'}
                        onClick={(): void => {
                            toggleWsDebugWindow();
                        }}
                    >
                        {isWsWindowOpen ? 'Close Window' : 'Launch Window'}
                    </Button>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-subtle p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                            <Bug size={18} />
                            Serval Fur Tweaker
                        </div>
                        <Text size="sm" variant="muted">
                            Adjust procedural fur pattern parameters in
                            real-time.
                        </Text>
                    </div>
                    <Button
                        variant={isFurTweakerOpen ? 'danger' : 'primary'}
                        onClick={(): {
                            payload: undefined;
                            type: 'furTweaker/toggleFurTweaker';
                        } => dispatch(toggleFurTweaker())}
                    >
                        {isFurTweakerOpen ? 'Close Window' : 'Launch Window'}
                    </Button>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-subtle p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                            <Bug size={18} />
                            Theme Switcher
                        </div>
                        <Text size="sm" variant="muted">
                            Switch themes without having to open settings.
                        </Text>
                    </div>
                    <Button
                        variant={isThemeTweakerOpen ? 'danger' : 'primary'}
                        onClick={(): {
                            payload: undefined;
                            type: 'themeTweaker/toggleThemeTweaker';
                        } => dispatch(toggleThemeTweaker())}
                    >
                        {isThemeTweakerOpen ? 'Close Window' : 'Launch Window'}
                    </Button>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-subtle p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                            <Bug size={18} />
                            Console
                        </div>
                        <Text size="sm" variant="muted">
                            Open a Windows NT styled console window.
                        </Text>
                    </div>
                    <Button
                        variant={isConsoleOpen ? 'danger' : 'primary'}
                        onClick={(): {
                            payload: undefined;
                            type: 'debugOptions/toggleConsole';
                        } => dispatch(toggleConsole())}
                    >
                        {isConsoleOpen ? 'Close Console' : 'Open Console'}
                    </Button>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-subtle p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                            <Bug size={18} />
                            Enable username color resolver context menu
                        </div>
                        <Text size="sm" variant="muted">
                            Adds a username context menu item that shows color,
                            glow, input data, and resolver order.
                        </Text>
                    </div>
                    <Toggle
                        checked={usernameColorResolverContextMenu}
                        onCheckedChange={(): {
                            payload: undefined;
                            type: 'debugOptions/toggleUsernameColorResolverContextMenu';
                        } => dispatch(toggleUsernameColorResolverContextMenu())}
                    />
                </div>

                <div className="flex items-center justify-between rounded-md border border-danger/40 bg-bg-subtle p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-semibold text-danger">
                            <Bug size={18} />
                            Crash Frontend
                        </div>
                        <Text size="sm" variant="muted">
                            Unsafely throws an uncaught browser error for
                            telemetry testing (oh btw the said teletry isnt
                            connected anywhere).
                        </Text>
                    </div>
                    <Button
                        variant="danger"
                        onClick={(): void => {
                            void crashFrontend();
                        }}
                    >
                        Crash Now
                    </Button>
                </div>
            </div>
        </div>
    );
};
