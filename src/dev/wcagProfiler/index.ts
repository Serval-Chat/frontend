import { Reporter } from './reporter';
import { scanDocument } from './scanner';
import { ScanScheduler } from './scheduler';

export interface WcagProfilerEnv {
    DEV: boolean;
}

const STORAGE_KEY = 'serchat:wcag-profiler-paused';

declare global {
    interface Window {
        __wcag?: {
            scan: () => void;
            pause: () => void;
            resume: () => void;
            reset: () => void;
        };
    }
}

let scheduler: ScanScheduler | null = null;
let reporter: Reporter | null = null;
let scanNumber = 0;

const isPaused = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

const setPaused = (paused: boolean): void => {
    try {
        if (paused) {
            localStorage.setItem(STORAGE_KEY, 'true');
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // localStorage unavailable, blocked maybe?
    }
};

const detectTheme = (): string => {
    const match = document.documentElement.className.match(/theme-[\w-]+/);
    return match ? match[0].replace('theme-', '') : 'unknown';
};

const isReporterRoute = (): boolean =>
    window.location.pathname.replace(/\/+$/, '') === '/wcag-reporter';

const runScan = async (): Promise<void> => {
    if (!scheduler || !reporter) return;
    if (isReporterRoute()) {
        scheduler.notifyScanComplete();
        return;
    }
    const route = window.location.pathname;
    const outcome = await scanDocument();
    if (isReporterRoute()) {
        scheduler.notifyScanComplete();
        return;
    }
    if (outcome.status === 'error') {
        console.error('[wcag] axe run failed:', outcome.error);
    } else {
        scanNumber++;
        void reporter
            .report(outcome.results, {
                scanNumber,
                route,
                theme: detectTheme(),
                durationMs: outcome.durationMs,
            })
            .catch((error: unknown): void => {
                console.error('[wcag] failed to send report:', error);
            });
    }
    scheduler.notifyScanComplete();
};

export const startWcagProfiler = (env: WcagProfilerEnv): void => {
    if (!env.DEV) return;
    if (scheduler) return;

    reporter = new Reporter();
    scheduler = new ScanScheduler({
        onScanDue: (): void => {
            void runScan();
        },
    });

    window.__wcag = {
        scan: (): void => {
            scheduler?.forceScan();
        },
        pause: (): void => {
            scheduler?.stop();
            setPaused(true);
            console.log('[wcag] profiler paused');
        },
        resume: (): void => {
            if (!scheduler) return;
            setPaused(false);
            scanNumber = 0;
            scheduler.start();
            console.log('[wcag] profiler resumed');
        },
        reset: (): void => {
            scanNumber = 0;
            console.log('[wcag] scan counter reset');
        },
    };

    if (!isPaused()) {
        scheduler.start();
    } else {
        console.log(
            '[wcag] profiler is paused — run __wcag.resume() to enable',
        );
    }
};
