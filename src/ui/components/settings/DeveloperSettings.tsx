import React from 'react';

import { Bug } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleUsernameColorResolverContextMenu } from '@/store/slices/debugOptionsSlice';
import { toggleFurTweaker } from '@/store/slices/furTweakerSlice';
import { toggleThemeTweaker } from '@/store/slices/themeTweakerSlice';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Toggle } from '@/ui/components/common/Toggle';
import { toggleWsDebugWindow, useWsDebugWindowOpen } from '@/ws/debug';

export const DeveloperSettings: React.FC = () => {
    const dispatch = useAppDispatch();
    const isWsWindowOpen = useWsDebugWindowOpen();
    const isFurTweakerOpen = useAppSelector((state) => state.furTweaker.isOpen);
    const isThemeTweakerOpen = useAppSelector(
        (state) => state.themeTweaker.isOpen,
    );
    const usernameColorResolverContextMenu = useAppSelector(
        (state) =>
            state.debugOptions?.usernameColorResolverContextMenu ?? false,
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
                        onClick={() => toggleWsDebugWindow()}
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
                        onClick={() => dispatch(toggleFurTweaker())}
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
                        onClick={() => dispatch(toggleThemeTweaker())}
                    >
                        {isThemeTweakerOpen ? 'Close Window' : 'Launch Window'}
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
                        onCheckedChange={() =>
                            dispatch(toggleUsernameColorResolverContextMenu())
                        }
                    />
                </div>
            </div>
        </div>
    );
};
