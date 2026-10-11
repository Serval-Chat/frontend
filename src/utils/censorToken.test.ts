import { describe, expect, it } from 'vitest';

import { censorToken } from './censorToken';

describe('censorToken', (): void => {
    it('keeps the serchat_ prefix and masks the rest past four characters', (): void => {
        expect(censorToken('serchat_abcdefgh12345678')).toBe(
            'serchat_abcd••••••••••••',
        );
    });

    it('masks an unprefixed token past its first eight characters', (): void => {
        expect(censorToken('abcdefghijkl')).toBe('abcdefgh••••');
    });

    it('leaves a token too short to mask untouched', (): void => {
        expect(censorToken('abc')).toBe('abc');
    });
});
