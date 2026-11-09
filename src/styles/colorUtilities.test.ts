// @vitest-environment node
import { __unstable__loadDesignSystem } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(__dirname, '..');

const COLOR_UTILITY =
    /^(?:[a-z0-9-]+:)*!?(?:bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|fill|stroke|from|via|to|divide|placeholder|decoration|accent|caret|shadow|inset-shadow|inset-ring)-[a-z][a-z0-9-]*(?:\/[0-9.]+)?$/;

const NOT_CLASS_NAMES = new Set([
    'border-bottom',
    'border-box',
    'border-color',
    'border-left',
    'border-radius',
    'border-right',
    'border-top',
    'stroke-linecap',
    'stroke-width',
    'decoration-file',
    'decoration-name',
    'text-weights',
]);

describe('Tailwind color utilities', (): void => {
    it('only uses colors the theme defines', async (): Promise<void> => {
        const css = fs.readFileSync(path.join(SRC, 'styles/index.css'), 'utf8');
        const designSystem = await __unstable__loadDesignSystem(css, {
            base: path.join(SRC, 'styles'),
        });
        const candidates = new Scanner({
            sources: [
                { base: SRC, pattern: '**/*.{ts,tsx}', negated: false },
                { base: SRC, pattern: '**/*.test.{ts,tsx}', negated: true },
            ],
        })
            .scan()
            .filter(
                (candidate) =>
                    COLOR_UTILITY.test(candidate) &&
                    !NOT_CLASS_NAMES.has(candidate),
            );

        const generated = designSystem.candidatesToCss(candidates);
        const undefinedUtilities = candidates
            .filter((_, index) => generated[index] === null)
            .sort();

        expect(undefinedUtilities).toEqual([]);
    }, 30_000);
});
