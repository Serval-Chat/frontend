import { describe, expect, it } from 'vitest';

import { formatMinutesDuration } from './duration';

describe('formatMinutesDuration', (): void => {
    it('formats whole days', (): void => {
        expect(formatMinutesDuration(1440)).toBe('1 day');
        expect(formatMinutesDuration(2880)).toBe('2 days');
    });

    it('formats whole hours when not a whole day', (): void => {
        expect(formatMinutesDuration(60)).toBe('1 hour');
        expect(formatMinutesDuration(180)).toBe('3 hours');
    });

    it('falls back to minutes when not a whole hour', (): void => {
        expect(formatMinutesDuration(1)).toBe('1 minute');
        expect(formatMinutesDuration(45)).toBe('45 minutes');
        expect(formatMinutesDuration(90)).toBe('90 minutes');
    });

    it('prefers the largest clean unit', (): void => {
        expect(formatMinutesDuration(1500)).toBe('25 hours');
        // Not a whole number of hours or days, so it stays in minutes.
        expect(formatMinutesDuration(100)).toBe('100 minutes');
    });
});
