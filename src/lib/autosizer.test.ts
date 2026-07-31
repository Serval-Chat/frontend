import { describe, expect, it } from 'vitest';

import { formatFileSize } from './autosizer';

describe('formatFileSize', () => {
    it('formats sizes under 1 KB as whole bytes', () => {
        expect(formatFileSize(0)).toBe('0 B');
        expect(formatFileSize(512)).toBe('512 B');
        expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('formats kilobytes with one decimal place', () => {
        expect(formatFileSize(1024)).toBe('1.0 KB');
        expect(formatFileSize(1536)).toBe('1.5 KB');
        expect(formatFileSize(1024 * 1023)).toBe('1023.0 KB');
    });

    it('formats megabytes with one decimal place', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
        expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });

    it('formats gigabytes and terabytes', () => {
        expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
        expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
    });

    it('caps at petabytes instead of throwing for absurdly large values', () => {
        expect(formatFileSize(1024 ** 5)).toBe('1.0 PB');
        expect(formatFileSize(1024 ** 6)).toBe('1024.0 PB');
    });
});
