import { X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';

import { ColorPickerPopover } from './ColorPickerPopover';

type ActivePicker = {
    type: 'glow' | 'gradient' | 'profilePrimary' | 'profileAccent';
    index?: number;
} | null;

interface ProfileColorsSectionProps {
    primaryColor: string | null;
    accentColor: string | null;
    accentWithoutPrimary: boolean;
    activeColorPicker: ActivePicker;
    hexDraft: string;
    pickerRef: React.RefObject<HTMLDivElement | null>;
    triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
    pickerCoords: { x: number; y: number };
    setPrimaryColor: (value: string | null) => void;
    setAccentColor: (value: string | null) => void;
    setActiveColorPicker: (value: ActivePicker) => void;
    setHexDraft: (value: string) => void;
}

export const ProfileColorsSection = ({
    primaryColor,
    accentColor,
    accentWithoutPrimary,
    activeColorPicker,
    hexDraft,
    pickerRef,
    triggerRef,
    pickerCoords,
    setPrimaryColor,
    setAccentColor,
    setActiveColorPicker,
    setHexDraft,
}: ProfileColorsSectionProps): React.ReactNode => {
    const isProfilePicker =
        activeColorPicker?.type === 'profilePrimary' ||
        activeColorPicker?.type === 'profileAccent';

    const entries = [
        {
            key: 'profilePrimary' as const,
            label: 'Primary',
            value: primaryColor,
        },
        { key: 'profileAccent' as const, label: 'Accent', value: accentColor },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Heading level={4}>Profile Colors</Heading>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-subtle p-4">
                <div className="flex flex-wrap gap-6">
                    {entries.map(({ key, label, value }) => (
                        <div className="flex items-center gap-3" key={key}>
                            <span className="text-sm font-medium text-foreground">
                                {label}:
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    aria-label={`${label} color: ${value ?? 'default'}`}
                                    className="h-8 w-12 rounded border border-border-subtle transition-transform hover:scale-105"
                                    style={{
                                        backgroundColor: value ?? '#313338',
                                    }}
                                    type="button"
                                    onClick={(e): void => {
                                        triggerRef.current = e.currentTarget;
                                        setHexDraft(value ?? '#313338');
                                        setActiveColorPicker({ type: key });
                                    }}
                                />
                                {value ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(): void => {
                                            if (key === 'profilePrimary') {
                                                setPrimaryColor(null);
                                                setAccentColor(null);
                                            } else {
                                                setAccentColor(null);
                                            }
                                        }}
                                    >
                                        <X size={12} />
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
                {activeColorPicker && isProfilePicker ? (
                    <ColorPickerPopover
                        color={
                            activeColorPicker.type === 'profilePrimary'
                                ? (primaryColor ?? '#313338')
                                : (accentColor ?? '#313338')
                        }
                        coords={pickerCoords}
                        hexDraft={hexDraft}
                        pickerRef={pickerRef}
                        onChange={(c): void => {
                            if (activeColorPicker.type === 'profilePrimary') {
                                setPrimaryColor(c);
                            } else {
                                setAccentColor(c);
                            }
                        }}
                        onClose={(): void => {
                            setActiveColorPicker(null);
                        }}
                        onHexDraftChange={setHexDraft}
                    />
                ) : null}
                {accentWithoutPrimary ? (
                    <p className="mt-2 text-xs text-danger">
                        Accent color requires a primary color.
                    </p>
                ) : null}
            </div>
        </div>
    );
};
