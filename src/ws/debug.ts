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
    listeners.forEach((l) => l());
};

export const addWsDebugEvent = (
    event: Omit<DebugWsEvent, 'id' | 'timestamp'>,
): void => {
    const newEvent: DebugWsEvent = {
        ...event,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
    };

    events = [newEvent, ...events].slice(0, MAX_EVENTS);
    notify();
};

export const clearWsDebugEvents = (): void => {
    events = [];
    notify();
};

export const useWsDebugEvents = (): DebugWsEvent[] => {
    const [currentEvents, setCurrentEvents] = useState<DebugWsEvent[]>(events);

    useEffect(() => {
        const listener = (): void => setCurrentEvents([...events]);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);
    return currentEvents;
};

let isWindowOpen = localStorage.getItem('serchat:debug-window') === 'true';

export const toggleWsDebugWindow = (force?: boolean): void => {
    isWindowOpen = force !== undefined ? force : !isWindowOpen;
    localStorage.setItem('serchat:debug-window', String(isWindowOpen));
    notify();
};

export const useWsDebugWindowOpen = (): boolean => {
    const [open, setOpen] = useState(isWindowOpen);

    useEffect(() => {
        const listener = (): void => setOpen(isWindowOpen);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    return open;
};
