export interface SchedulerDeps {
    onScanDue: () => void;
    observeRoot?: Node;
    isHidden?: () => boolean;
    debounceMs?: number;
    maxWaitMs?: number;
    graceMs?: number;
    throttleMs?: number;
}

const DEFAULTS = {
    debounceMs: 1000,
    maxWaitMs: 5000,
    graceMs: 300,
    throttleMs: 1000,
};

const IGNORED_TAGS = new Set(['STYLE', 'SCRIPT']);

const isIgnoredNode = (node: Node): boolean =>
    node.nodeType === Node.ELEMENT_NODE &&
    IGNORED_TAGS.has((node as Element).tagName);

// axe may temporarily mutate the DOM (injected <style>)
const isRelevantMutation = (record: MutationRecord): boolean => {
    if (record.type === 'attributes') {
        return record.attributeName !== 'style';
    }
    if (record.type === 'characterData') {
        return true;
    }
    const touched = [...record.addedNodes, ...record.removedNodes];
    return touched.some((node): boolean => !isIgnoredNode(node));
};

export class ScanScheduler {
    private readonly onScanDue: () => void;
    private readonly isHidden: () => boolean;
    private readonly debounceMs: number;
    private readonly maxWaitMs: number;
    private readonly graceMs: number;
    private readonly throttleMs: number;
    private readonly observeRoot: Node;

    private observer: MutationObserver | null = null;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
    private graceTimer: ReturnType<typeof setTimeout> | null = null;
    private throttleTimer: ReturnType<typeof setTimeout> | null = null;

    private running = false;
    private dirty = false;
    private inGrace = false;
    private lastScanStartedAt = 0;
    private stopped = true;

    constructor(deps: SchedulerDeps) {
        this.onScanDue = deps.onScanDue;
        this.isHidden = deps.isHidden ?? ((): boolean => document.hidden);
        this.observeRoot = deps.observeRoot ?? document.documentElement;
        this.debounceMs = deps.debounceMs ?? DEFAULTS.debounceMs;
        this.maxWaitMs = deps.maxWaitMs ?? DEFAULTS.maxWaitMs;
        this.graceMs = deps.graceMs ?? DEFAULTS.graceMs;
        this.throttleMs = deps.throttleMs ?? DEFAULTS.throttleMs;
    }

    start(): void {
        if (!this.stopped) return;
        this.stopped = false;
        this.observer = new MutationObserver(this.handleMutations);
        this.observer.observe(this.observeRoot, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
        });
        document.addEventListener('visibilitychange', this.handleVisibility);
        this.markDirty();
    }

    stop(): void {
        if (this.stopped) return;
        this.stopped = true;
        this.observer?.disconnect();
        this.observer = null;
        document.removeEventListener('visibilitychange', this.handleVisibility);
        this.clearTimer('debounceTimer');
        this.clearTimer('maxWaitTimer');
        this.clearTimer('graceTimer');
        this.clearTimer('throttleTimer');
        this.dirty = false;
        this.inGrace = false;
    }

    forceScan(): void {
        if (this.stopped) return;
        if (this.running) {
            this.dirty = true;
            return;
        }
        this.clearTimer('debounceTimer');
        this.clearTimer('maxWaitTimer');
        this.requestScan(true);
    }

    notifyScanComplete(): void {
        this.running = false;
        if (this.stopped) return;
        this.inGrace = true;
        this.clearTimer('graceTimer');
        this.graceTimer = setTimeout((): void => {
            this.graceTimer = null;
            this.inGrace = false;
            if (this.dirty) this.schedule();
        }, this.graceMs);
    }

    private readonly handleMutations = (records: MutationRecord[]): void => {
        if (this.stopped) return;
        if (!records.some(isRelevantMutation)) return;
        if (this.running || this.inGrace) {
            this.dirty = true;
            return;
        }
        this.markDirty();
    };

    private readonly handleVisibility = (): void => {
        if (this.stopped || document.hidden) return;
        if (this.dirty) this.schedule();
    };

    private markDirty(): void {
        this.dirty = true;
        if (this.maxWaitTimer === null) {
            this.maxWaitTimer = setTimeout((): void => {
                this.maxWaitTimer = null;
                this.requestScan();
            }, this.maxWaitMs);
        }
        this.schedule();
    }

    private schedule(): void {
        this.clearTimer('debounceTimer');
        this.debounceTimer = setTimeout((): void => {
            this.debounceTimer = null;
            this.requestScan();
        }, this.debounceMs);
    }

    private requestScan(bypassHidden = false): void {
        if (this.running) return;
        if (!bypassHidden && this.isHidden()) {
            this.clearTimer('maxWaitTimer');
            return;
        }
        const sinceLast = Date.now() - this.lastScanStartedAt;
        const throttleRemaining = this.throttleMs - sinceLast;
        if (throttleRemaining > 0) {
            this.clearTimer('throttleTimer');
            this.throttleTimer = setTimeout((): void => {
                this.throttleTimer = null;
                this.requestScan(bypassHidden);
            }, throttleRemaining);
            return;
        }
        this.clearTimer('debounceTimer');
        this.clearTimer('maxWaitTimer');
        this.dirty = false;
        this.running = true;
        this.lastScanStartedAt = Date.now();
        this.onScanDue();
    }

    private clearTimer(
        name: 'debounceTimer' | 'maxWaitTimer' | 'graceTimer' | 'throttleTimer',
    ): void {
        const timer = this[name];
        if (timer !== null) {
            clearTimeout(timer);
            this[name] = null;
        }
    }
}
