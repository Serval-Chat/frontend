import { describe, expect, it } from 'vitest';

import { KeybindManager } from './KeybindManager';

describe('KeybindManager', (): void => {
    it('matches default keybinds', (): void => {
        const manager = new KeybindManager();
        const event = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' });

        expect(manager.matches('composer.focus', event)).toBe(true);
    });

    it('matches user overrides', (): void => {
        const manager = new KeybindManager({
            'debug.theme.next': { code: 'KeyT', ctrl: true },
        });
        const event = new KeyboardEvent('keydown', {
            code: 'KeyT',
            ctrlKey: true,
        });

        expect(manager.matches('debug.theme.next', event)).toBe(true);
    });

    it('supports clearing bindings', (): void => {
        const manager = new KeybindManager({ 'debug.theme.next': null });
        const event = new KeyboardEvent('keydown', {
            code: 'Digit4',
            altKey: true,
        });

        expect(manager.matches('debug.theme.next', event)).toBe(false);
    });
});
