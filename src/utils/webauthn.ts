import {
    WebAuthnError,
    browserSupportsWebAuthn,
} from '@simplewebauthn/browser';

import { isTauri } from '@/utils/tauri';

export const canUsePasskeys = (): boolean =>
    !isTauri() && browserSupportsWebAuthn();

export const isWebAuthnCancellation = (error: unknown): boolean =>
    error instanceof WebAuthnError && error.name === 'NotAllowedError';
