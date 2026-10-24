import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Reporter } from './reporter';
import type { AxeResults } from './scanner';

const { postSpy } = vi.hoisted(() => ({
    postSpy: vi.fn(async () => ({ data: {} })),
}));

vi.mock('@/api/client', () => ({ apiClient: { post: postSpy } }));
vi.mock('@/utils/authToken', () => ({ hasAuthToken: (): boolean => true }));

const META = {
    scanNumber: 1,
    route: '/chat/@me',
    theme: 'serval',
    durationMs: 120,
};

const makeResults = (targets: string[]): AxeResults =>
    ({
        violations: [
            {
                id: 'color-contrast',
                help: 'Ensure the contrast is sufficient.',
                helpUrl: 'https://example.com/color-contrast',
                impact: 'serious',
                description: '',
                tags: ['wcag2aa'],
                nodes: targets.map((target) => ({
                    html: `<button>${target}</button>`,
                    target: [target],
                    any: [],
                    all: [],
                    none: [],
                    failureSummary: 'Fix this element',
                })),
            },
        ],
        passes: [],
        incomplete: [],
        inapplicable: [],
        testEngine: { name: 'axe-core', version: '4.14.0' },
        testRunner: { name: 'axe' },
        testEnvironment: {
            userAgent: 'test',
            windowWidth: 1024,
            windowHeight: 768,
        },
        toolOptions: {},
    }) as unknown as AxeResults;

describe('Reporter', (): void => {
    beforeEach((): void => {
        postSpy.mockClear();
    });

    it('posts every violation node with the scan context', async (): Promise<void> => {
        const reporter = new Reporter();
        await reporter.report(makeResults(['#save', '#cancel']), META);

        expect(postSpy).toHaveBeenCalledWith('/api/v1/_internal/wcag/', {
            ...META,
            issues: [
                expect.objectContaining({
                    ruleId: 'color-contrast',
                    impact: 'serious',
                    target: ['#save'],
                }),
                expect.objectContaining({
                    ruleId: 'color-contrast',
                    impact: 'serious',
                    target: ['#cancel'],
                }),
            ],
        });
    });

    it('posts repeated issues again so the backend can deduplicate and count them', async (): Promise<void> => {
        const reporter = new Reporter();
        const results = makeResults(['#save']);

        await reporter.report(results, META);
        await reporter.report(results, { ...META, scanNumber: 2 });

        expect(postSpy).toHaveBeenCalledTimes(2);
    });
});
