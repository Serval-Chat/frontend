import React from 'react';

import { AlertTriangle, Keyboard, RotateCcw, X } from 'lucide-react';

import { useMe, useUpdateSettings } from '@/api/users/users.queries';
import type { KeybindBinding, UserKeybinds } from '@/api/users/users.types';
import {
    KEYBIND_ACTIONS,
    type KeybindActionId,
    KeybindManager,
} from '@/keybinds/KeybindManager';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { SettingsFloatingBar } from '@/ui/components/common/SettingsFloatingBar';
import { Text } from '@/ui/components/common/Text';

const normalizeBinding = (binding: KeybindBinding): KeybindBinding => ({
    code: binding.code,
    ctrl: binding.ctrl || undefined,
    alt: binding.alt || undefined,
    shift: binding.shift || undefined,
    meta: binding.meta || undefined,
});

const sameBinding = (
    a: KeybindBinding | null | undefined,
    b: KeybindBinding | null | undefined,
): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const findCollisions = (
    keybinds: UserKeybinds,
    actionId: KeybindActionId,
): string[] => {
    const binding = keybinds[actionId];
    if (!binding) return [];

    return KEYBIND_ACTIONS.flatMap((action): string[] =>
        action.id !== actionId && sameBinding(binding, keybinds[action.id])
            ? [action.label]
            : [],
    );
};

export const KeybindSettings = () => {
    const { data: user, isLoading } = useMe();
    const { mutate: updateSettings, isPending } = useUpdateSettings();
    const [draft, setDraft] = React.useState<UserKeybinds>({});
    const [recordingAction, setRecordingAction] =
        React.useState<KeybindActionId | null>(null);

    const savedKeybinds = React.useMemo(
        () => user?.settings?.keybinds ?? {},
        [user?.settings?.keybinds],
    );

    const prevSavedKeybindsRef = React.useRef(savedKeybinds);

    if (savedKeybinds !== prevSavedKeybindsRef.current) {
        prevSavedKeybindsRef.current = savedKeybinds;
        setDraft(savedKeybinds);
    }

    React.useEffect((): (() => void) | undefined => {
        if (!recordingAction) return undefined;

        const handleKeyDown = (event: KeyboardEvent): void => {
            event.preventDefault();
            event.stopPropagation();

            if (event.code === 'Escape') {
                setRecordingAction(null);
                return;
            }

            const modifierKeys = [
                'ShiftLeft',
                'ShiftRight',
                'ControlLeft',
                'ControlRight',
                'AltLeft',
                'AltRight',
                'MetaLeft',
                'MetaRight',
            ];
            if (modifierKeys.includes(event.code)) {
                return;
            }

            setDraft((current): { [x: string]: KeybindBinding | null } => ({
                ...current,
                [recordingAction]: normalizeBinding(
                    KeybindManager.fromEvent(event),
                ),
            }));
            setRecordingAction(null);
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return (): void =>
            window.removeEventListener('keydown', handleKeyDown, true);
    }, [recordingAction]);

    const hasChanges = React.useMemo(
        (): boolean =>
            KEYBIND_ACTIONS.some(
                (action): boolean =>
                    !sameBinding(draft[action.id], savedKeybinds[action.id]),
            ),
        [draft, savedKeybinds],
    );

    const handleSave = (): void => {
        updateSettings({ keybinds: draft });
    };

    const handleResetChanges = (): void => {
        setDraft(savedKeybinds);
        setRecordingAction(null);
    };

    const handleResetToDefault = (actionId: KeybindActionId): void => {
        setDraft((current): { [x: string]: KeybindBinding | null } => {
            const next = { ...current };
            delete next[actionId];
            return next;
        });
    };

    const handleClear = (actionId: KeybindActionId): void => {
        setDraft((current): { [x: string]: KeybindBinding | null } => ({
            ...current,
            [actionId]: null,
        }));
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Text variant="muted">Loading keybinds...</Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-24 lg:pb-0">
            <div className="mb-8">
                <Heading className="mb-2" level={3}>
                    Keybinds
                </Heading>
                <Text variant="muted">
                    Customize keyboard shortcuts used around Serchat.
                </Text>
            </div>

            <div className="space-y-3">
                {KEYBIND_ACTIONS.map((action) => {
                    const manager = new KeybindManager(draft);
                    const binding = manager.getBinding(action.id);
                    const isRecording = recordingAction === action.id;
                    const collisions = findCollisions(draft, action.id);

                    return (
                        <div
                            className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4 md:flex-row md:items-center md:justify-between"
                            key={action.id}
                        >
                            <div className="min-w-0 space-y-1">
                                <Text size="xs" variant="muted">
                                    ID: <code>{action.id}</code>
                                </Text>
                                <div className="flex items-center gap-2">
                                    <Keyboard
                                        className="text-muted-foreground"
                                        size={16}
                                    />
                                    <Text weight="medium">{action.label}</Text>
                                </div>
                                <Text size="sm" variant="muted">
                                    {action.description}
                                </Text>
                                {collisions.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs text-danger">
                                        <AlertTriangle size={12} />
                                        <Text size="xs" variant="danger">
                                            Collides with:{' '}
                                            {collisions.join(', ')}
                                        </Text>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    className="min-w-36 justify-center font-mono"
                                    variant={
                                        isRecording
                                            ? 'primary'
                                            : collisions.length > 0
                                              ? 'danger'
                                              : 'ghost'
                                    }
                                    onClick={(): void =>
                                        setRecordingAction(action.id)
                                    }
                                >
                                    {isRecording ? (
                                        'Press keys...'
                                    ) : (
                                        <code>
                                            {KeybindManager.format(binding)}
                                        </code>
                                    )}
                                </Button>
                                <Button
                                    icon={RotateCcw}
                                    title="Reset to default"
                                    variant="ghost"
                                    onClick={(): void =>
                                        handleResetToDefault(action.id)
                                    }
                                >
                                    Reset
                                </Button>
                                <Button
                                    icon={X}
                                    title="Clear keybind"
                                    variant="ghost"
                                    onClick={(): void => handleClear(action.id)}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <SettingsFloatingBar
                isPending={isPending}
                isVisible={hasChanges}
                message="Careful - you have unsaved keybind changes!"
                onReset={handleResetChanges}
                onSave={handleSave}
            />
        </div>
    );
};
