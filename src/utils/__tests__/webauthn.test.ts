import {
    WebAuthnError,
    browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { describe, expect, it, vi } from 'vitest';

import { isTauri } from '@/utils/tauri';
import { canUsePasskeys, isWebAuthnCancellation } from '@/utils/webauthn';

vi.mock('@/utils/tauri', () => ({
    isTauri: vi.fn(),
}));

describe('canUsePasskeys', () => {
    it('is true in a browser that supports WebAuthn and is not Tauri', () => {
        vi.mocked(isTauri).mockReturnValue(false);
        vi.mocked(browserSupportsWebAuthn).mockReturnValue(true);
        expect(canUsePasskeys()).toBe(true);
    });

    it('is false inside Tauri even if WebAuthn is supported', () => {
        vi.mocked(isTauri).mockReturnValue(true);
        vi.mocked(browserSupportsWebAuthn).mockReturnValue(true);
        expect(canUsePasskeys()).toBe(false);
    });

    it('is false when the browser does not support WebAuthn', () => {
        vi.mocked(isTauri).mockReturnValue(false);
        vi.mocked(browserSupportsWebAuthn).mockReturnValue(false);
        expect(canUsePasskeys()).toBe(false);
    });
});

describe('isWebAuthnCancellation', () => {
    it('is true for a WebAuthnError named NotAllowedError', () => {
        const cause = new Error('cancelled');
        cause.name = 'NotAllowedError';
        const error = new WebAuthnError({
            message: 'cancelled',
            code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
            cause,
            name: 'NotAllowedError',
        });

        expect(isWebAuthnCancellation(error)).toBe(true);
    });

    it('is false for a WebAuthnError with a different name', () => {
        const cause = new Error('oops');
        cause.name = 'UnknownError';
        const error = new WebAuthnError({
            message: 'oops',
            code: 'ERROR_AUTHENTICATOR_GENERAL_ERROR',
            cause,
            name: 'UnknownError',
        });

        expect(isWebAuthnCancellation(error)).toBe(false);
    });

    it('is false for a plain error', () => {
        expect(isWebAuthnCancellation(new Error('NotAllowedError'))).toBe(
            false,
        );
    });

    it('is false for a non-error value', () => {
        expect(isWebAuthnCancellation('NotAllowedError')).toBe(false);
    });
});
