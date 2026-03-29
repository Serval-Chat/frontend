import React, { useRef, useState } from 'react';

import { X } from 'lucide-react';

import { IconButton } from '@/ui/components/common/IconButton';
import { toggleWsDebugWindow, useWsDebugEvents } from '@/ws/debug';

export const DeveloperDebugWindow: React.FC = () => {
    const events = useWsDebugEvents();
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent): void => {
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent): void => {
        if (!isDragging.current) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y,
        });
    };

    const handlePointerUp = (e: React.PointerEvent): void => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div
            className="border-border fixed z-[9999] flex flex-col overflow-hidden rounded-md border bg-background shadow-2xl"
            style={{
                left: position.x,
                top: position.y,
                width: 500,
                height: 400,
                minWidth: 300,
                minHeight: 200,
                resize: 'both',
            }}
        >
            <div
                className="flex cursor-move items-center justify-between border-b border-border-subtle bg-bg-subtle px-3 py-2"
                onPointerCancel={handlePointerUp}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <span className="text-sm font-semibold text-foreground">
                    WS Debugger ({events.length})
                </span>
                <IconButton
                    className="text-muted-foreground hover:bg-danger/20 hover:text-danger"
                    icon={X}
                    iconSize={16}
                    onClick={() => toggleWsDebugWindow(false)}
                />
            </div>

            <div className="scrollbar-thin scrollbar-thumb-bg-secondary flex-1 space-y-2 overflow-y-auto p-2">
                {events.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Waiting for events...
                    </div>
                ) : (
                    events.map((event) => (
                        <div
                            className="flex flex-col gap-1 rounded border border-border-subtle bg-bg-subtle p-2 text-xs shadow-sm"
                            key={event.id}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded px-1.5 py-0.5 font-mono ${
                                            event.direction === 'in'
                                                ? 'bg-blue-500/10 text-blue-500'
                                                : 'bg-green-500/10 text-green-500'
                                        }`}
                                    >
                                        {event.direction.toUpperCase()}
                                    </span>
                                    <span className="font-mono font-bold text-foreground">
                                        {event.type}
                                    </span>
                                </div>
                                <span className="text-muted-foreground">
                                    {new Date(
                                        event.timestamp,
                                    ).toLocaleTimeString()}{' '}
                                    {new Date(
                                        event.timestamp,
                                    ).getMilliseconds()}
                                    ms
                                </span>
                            </div>

                            {!!event.payload && (
                                <pre className="mt-1 overflow-x-auto rounded bg-background p-1.5 font-mono text-[10px] text-muted-foreground">
                                    {JSON.stringify(event.payload, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
