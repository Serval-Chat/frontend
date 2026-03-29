import React from 'react';

import { Bug } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { toggleWsDebugWindow, useWsDebugWindowOpen } from '@/ws/debug';

export const DeveloperSettings: React.FC = () => {
    const isWindowOpen = useWsDebugWindowOpen();

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
                        variant={isWindowOpen ? 'danger' : 'primary'}
                        onClick={() => toggleWsDebugWindow()}
                    >
                        {isWindowOpen ? 'Close Window' : 'Launch Window'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
