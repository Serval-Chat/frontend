import { afterEach, describe, expect, it } from 'vitest';

import { scanDocument } from './scanner';

// jsdom has no layout engine, so layout-dependent rules (color-contrast)
// can't run here — they're exercised live in a real browser instead.
// These rule-scoped runs prove the axe wiring end-to-end.
const RULES_ONLY = (values: string[]): { type: 'rule'; values: string[] } => ({
    type: 'rule',
    values,
});

describe('scanDocument', (): void => {
    afterEach((): void => {
        document.body.innerHTML = '';
        document.documentElement.lang = '';
    });

    it('detects an image with no alt text', async (): Promise<void> => {
        document.body.innerHTML = '<img src="/x.png">';
        const outcome = await scanDocument({
            runOnly: RULES_ONLY(['image-alt']),
        });
        expect(outcome.status).toBe('ok');
        if (outcome.status !== 'ok') return;
        expect(outcome.results.violations.map((v) => v.id)).toEqual([
            'image-alt',
        ]);
        expect(outcome.results.violations[0]?.nodes[0]?.html).toContain(
            '<img src="/x.png">',
        );
    });

    it('reports no violations for an accessible fixture', async (): Promise<void> => {
        document.body.innerHTML = `
            <img src="/x.png" alt="An x">
            <button type="button">Send</button>
            <label for="name">Name</label>
            <input id="name" type="text">
        `;
        const outcome = await scanDocument({
            runOnly: RULES_ONLY(['image-alt', 'button-name', 'label']),
        });
        expect(outcome.status).toBe('ok');
        if (outcome.status !== 'ok') return;
        expect(outcome.results.violations).toEqual([]);
    });

    it('detects a button with no accessible name', async (): Promise<void> => {
        document.body.innerHTML =
            '<button type="button"><span aria-hidden="true">x</span></button>';
        const outcome = await scanDocument({
            runOnly: RULES_ONLY(['button-name']),
        });
        expect(outcome.status).toBe('ok');
        if (outcome.status !== 'ok') return;
        expect(outcome.results.violations.map((v) => v.id)).toEqual([
            'button-name',
        ]);
    });

    it('only returns violations (no passes/incomplete payloads)', async (): Promise<void> => {
        document.body.innerHTML = '<img src="/x.png">';
        const outcome = await scanDocument({
            runOnly: RULES_ONLY(['image-alt']),
        });
        expect(outcome.status).toBe('ok');
        if (outcome.status !== 'ok') return;
        expect(outcome.results.passes).toEqual([]);
        expect(outcome.results.incomplete).toEqual([]);
        expect(outcome.results.inapplicable).toEqual([]);
    });

    it('records a duration for the scan', async (): Promise<void> => {
        document.body.innerHTML = '';
        const outcome = await scanDocument({
            runOnly: RULES_ONLY(['image-alt']),
        });
        expect(outcome.status).toBe('ok');
        expect(outcome.durationMs).toBeGreaterThanOrEqual(0);
    });
});
