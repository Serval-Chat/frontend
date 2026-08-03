export type DebugSendMode = 'delay' | 'drop';

interface DebugSendInterceptor {
    mode: DebugSendMode;
    delayMs: number;
}

let _interceptor: DebugSendInterceptor | null = null;

export function armInterceptor(mode: DebugSendMode, delayMs = 2000): void {
    _interceptor = { mode, delayMs };
}

export function consumeInterceptor(): DebugSendInterceptor | null {
    const val = _interceptor;
    _interceptor = null;
    return val;
}
