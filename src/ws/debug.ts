import { useEffect, useState } from 'react';

export interface DebugWsEvent {
    id: string;
    timestamp: number;
    direction: 'in' | 'out';
    type: string;
    payload?: unknown;
    meta?: unknown;
}

const MAX_EVENTS = 200;
let events: DebugWsEvent[] = [];
const listeners = new Set<() => void>();

const notify = (): void => {
    for (const l of listeners) l();
};

export const addWsDebugEvent = (
    event: Omit<DebugWsEvent, 'id' | 'timestamp'>,
): void => {
    const newEvent: DebugWsEvent = {
        ...event,
        id: Math.random().toString(36).slice(2, 11),
        timestamp: Date.now(),
    };

    events = [newEvent, ...events].slice(0, MAX_EVENTS);
    notify();
};

export const useWsDebugEvents = (): DebugWsEvent[] => {
    const [currentEvents, setCurrentEvents] = useState<DebugWsEvent[]>(events);

    useEffect((): (() => void) => {
        const listener = (): void => {
            setCurrentEvents([...events]);
        };
        listeners.add(listener);
        return (): void => {
            listeners.delete(listener);
        };
    }, []);
    return currentEvents;
};

let isWindowOpen =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('serchat:debug-window') === 'true';

export const toggleWsDebugWindow = (force?: boolean): void => {
    isWindowOpen = force ?? !isWindowOpen;
    localStorage.setItem('serchat:debug-window', String(isWindowOpen));
    notify();
};

export const useWsDebugWindowOpen = (): boolean => {
    const [open, setOpen] = useState(isWindowOpen);

    useEffect((): (() => void) => {
        const listener = (): void => {
            setOpen(isWindowOpen);
        };
        listeners.add(listener);
        return (): void => {
            listeners.delete(listener);
        };
    }, []);

    return open;
};
