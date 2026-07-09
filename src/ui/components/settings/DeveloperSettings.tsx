import * as Sentry from '@sentry/react';
import { Bug } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    toggleConsole,
    toggleUsernameColorResolverContextMenu,
} from '@/store/slices/debugOptionsSlice';
import { toggleFurTweaker } from '@/store/slices/furTweakerSlice';
import { toggleThemeTweaker } from '@/store/slices/themeTweakerSlice';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Toggle } from '@/ui/components/common/Toggle';
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

    return (
        <div className="flex h-full flex-col gap-6">
            <div>
                <Heading level={2} variant="section">
                    Developer Parameters
                </Heading>
                <p className="mt-1 text-sm text-muted-foreground">
                    (Not) Advanced debugging tools and logs.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-subtle p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                            <Bug size={18} />
                            WebSocket Logger
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Open floating window to vuew all real-time events.
                        </span>
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
                        <span className="text-sm text-muted-foreground">
                            Adjust procedural fur pattern parameters in
                            real-time.
                        </span>
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
                        <span className="text-sm text-muted-foreground">
                            Switch themes without having to open settings.
                        </span>
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
                        <span className="text-sm text-muted-foreground">
                            Open a Windows NT styled console window.
                        </span>
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
                        <span className="text-sm text-muted-foreground">
                            Adds a username context menu item that shows color,
                            glow, input data, and resolver order.
                        </span>
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
                        <span className="text-sm text-muted-foreground">
                            Unsafely throws an uncaught browser error for
                            telemetry testing.
                        </span>
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
