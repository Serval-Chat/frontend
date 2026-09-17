import { afterEach, describe, expect, it } from 'vitest';

import { isTauri } from './tauri';

describe('isTauri', (): void => {
    afterEach((): void => {
        Reflect.deleteProperty(globalThis, '__TAURI_INTERNALS__');
    });

    it('returns false when __TAURI_INTERNALS__ is not present', (): void => {
        expect(isTauri()).toBe(false);
    });

    it('returns true when __TAURI_INTERNALS__ is present', (): void => {
        (globalThis as Record<string, unknown>).__TAURI_INTERNALS__ = {};
        expect(isTauri()).toBe(true);
    });

    it('does not depend on the legacy window.__TAURI__ flag', (): void => {
        (globalThis as Record<string, unknown>).__TAURI__ = {};
        expect(isTauri()).toBe(false);
        Reflect.deleteProperty(globalThis, '__TAURI__');
    });
});
