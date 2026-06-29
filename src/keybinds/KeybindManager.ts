import type { KeybindBinding, UserKeybinds } from '@/api/users/users.types';

export type KeybindActionId =
    | 'composer.focus'
    | 'debug.typing.more'
    | 'debug.typing.less'
    | 'debug.theme.previous'
    | 'debug.theme.next'
    | 'debug.notification.example'
    | 'debug.notification.dm'
    | 'debug.notification.mention';

export interface KeybindAction {
    id: KeybindActionId;
    label: string;
    description: string;
    category: string;
    defaultBinding: KeybindBinding;
}

export const KEYBIND_ACTIONS: KeybindAction[] = [
    {
        id: 'composer.focus',
        label: 'Focus Composer',
        description: 'Focus the message composer from chat.',
        category: 'Chat',
        defaultBinding: { code: 'Printable' },
    },
    {
        id: 'debug.typing.more',
        label: 'Increase Fake Typing',
        description: 'Increase the local fake typing indicator count.',
        category: 'Developer',
        defaultBinding: { code: 'Digit1', alt: true },
    },
    {
        id: 'debug.typing.less',
        label: 'Decrease Fake Typing',
        description: 'Decrease the local fake typing indicator count.',
        category: 'Developer',
        defaultBinding: { code: 'Digit2', alt: true },
    },
    {
        id: 'debug.theme.previous',
        label: 'Previous Theme',
        description: 'Switch to the previous chat background theme.',
        category: 'Developer',
        defaultBinding: { code: 'Digit3', alt: true },
    },
    {
        id: 'debug.theme.next',
        label: 'Next Theme',
        description: 'Switch to the next chat background theme.',
        category: 'Developer',
        defaultBinding: { code: 'Digit4', alt: true },
    },
    {
        id: 'debug.notification.example',
        label: 'Example Notification',
        description: 'Show an example in-app notification.',
        category: 'Developer',
        defaultBinding: { code: 'Digit5', alt: true },
    },
    {
        id: 'debug.notification.dm',
        label: 'Example DM Notification',
        description: 'Show an example DM in-app notification.',
        category: 'Developer',
        defaultBinding: { code: 'Digit6', alt: true },
    },
    {
        id: 'debug.notification.mention',
        label: 'Example Mention Notification',
        description: 'Show an example mention in-app notification.',
        category: 'Developer',
        defaultBinding: { code: 'Digit7', alt: true },
    },
];

const ACTIONS_BY_ID = new Map(
    KEYBIND_ACTIONS.map((action): [KeybindActionId, KeybindAction] => [
        action.id,
        action,
    ]),
);

const KEY_LABELS: Record<string, string> = {
    Slash: '/',
    Printable: 'Any character',
    Space: 'Space',
    Escape: 'Esc',
    Enter: 'Enter',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Tab: 'Tab',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
};

export class KeybindManager {
    private readonly overrides?: UserKeybinds;

    public constructor(overrides?: UserKeybinds) {
        this.overrides = overrides;
    }

    public getBinding(actionId: KeybindActionId): KeybindBinding | null {
        if (
            this.overrides &&
            Object.prototype.hasOwnProperty.call(this.overrides, actionId)
        ) {
            return this.overrides[actionId] ?? null;
        }

        return ACTIONS_BY_ID.get(actionId)?.defaultBinding ?? null;
    }

    public matches(actionId: KeybindActionId, event: KeyboardEvent): boolean {
        const binding = this.getBinding(actionId);
        if (!binding) return false;

        if (binding.code === 'Printable') {
            return (
                event.key.length === 1 &&
                !event.ctrlKey &&
                !event.altKey &&
                !event.metaKey
            );
        }

        return (
            event.code === binding.code &&
            event.ctrlKey === !!binding.ctrl &&
            event.altKey === !!binding.alt &&
            event.shiftKey === !!binding.shift &&
            event.metaKey === !!binding.meta
        );
    }

    public static fromEvent(event: KeyboardEvent): KeybindBinding {
        const isModifierKey = [
            'ShiftLeft',
            'ShiftRight',
            'ControlLeft',
            'ControlRight',
            'AltLeft',
            'AltRight',
            'MetaLeft',
            'MetaRight',
        ].includes(event.code);

        return {
            code: event.code,
            ctrl:
                isModifierKey && event.code.startsWith('Control')
                    ? undefined
                    : event.ctrlKey || undefined,
            alt:
                isModifierKey && event.code.startsWith('Alt')
                    ? undefined
                    : event.altKey || undefined,
            shift:
                isModifierKey && event.code.startsWith('Shift')
                    ? undefined
                    : event.shiftKey || undefined,
            meta:
                isModifierKey && event.code.startsWith('Meta')
                    ? undefined
                    : event.metaKey || undefined,
        };
    }

    public static format(binding: KeybindBinding | null | undefined): string {
        if (!binding) return 'Unassigned';

        const parts = [
            binding.ctrl ? 'Ctrl' : null,
            binding.alt ? 'Alt' : null,
            binding.shift ? 'Shift' : null,
            binding.meta ? 'Meta' : null,
            KeybindManager.formatCode(binding.code),
        ].filter((part): part is string => !!part);

        return parts.join(' + ');
    }

    private static formatCode(code: string): string {
        if (KEY_LABELS[code]) return KEY_LABELS[code];
        if (code.startsWith('Key')) return code.slice(3).toUpperCase();
        if (code.startsWith('Digit')) return code.slice(5);
        if (code.startsWith('Numpad')) return `Numpad ${code.slice(6)}`;
        return code.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
}
