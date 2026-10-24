import type * as axeNs from 'axe-core';

type AxeStatic = typeof axeNs;

export type AxeResults = axeNs.AxeResults;
export type AxeImpact = axeNs.ImpactValue;

export interface ScanRunOptions {
    runOnly?: { type: 'tag' | 'rule'; values: string[] };
}

export type ScanOutcome =
    | { status: 'ok'; results: AxeResults; durationMs: number }
    | { status: 'error'; error: unknown; durationMs: number };

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

let axePromise: Promise<AxeStatic> | null = null;

const loadAxe = (): Promise<AxeStatic> => {
    axePromise ??= import('axe-core').then(
        (mod): AxeStatic =>
            ((mod as { default?: AxeStatic }).default ??
                (mod as unknown as AxeStatic)) as AxeStatic,
    );
    return axePromise;
};

export const scanDocument = async (
    options: ScanRunOptions = {},
): Promise<ScanOutcome> => {
    const startedAt = performance.now();
    try {
        const axe = await loadAxe();
        const results = await axe.run(document, {
            runOnly: options.runOnly ?? { type: 'tag', values: WCAG_TAGS },
            resultTypes: ['violations'],
        });
        return {
            status: 'ok',
            results,
            durationMs: Math.round(performance.now() - startedAt),
        };
    } catch (error) {
        return {
            status: 'error',
            error,
            durationMs: Math.round(performance.now() - startedAt),
        };
    }
};
