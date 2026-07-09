import { Plus, X } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Toggle } from '@/ui/components/common/Toggle';

import { ColorPickerPopover } from './ColorPickerPopover';

type ActivePicker = {
    type: 'glow' | 'gradient' | 'profilePrimary' | 'profileAccent';
    index?: number;
} | null;

interface UsernameGradientSectionProps {
    gradientEnabled: boolean;
    gradientColors: { id: string; value: string }[];
    gradientAngle: number;
    activeColorPicker: ActivePicker;
    hexDraft: string;
    pickerRef: React.RefObject<HTMLDivElement | null>;
    triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
    pickerCoords: { x: number; y: number };
    setGradientEnabled: (value: boolean) => void;
    setGradientAngle: (value: number) => void;
    addGradientColor: () => void;
    removeGradientColor: (index: number) => void;
    updateGradientColor: (index: number, color: string) => void;
    setActiveColorPicker: (value: ActivePicker) => void;
    setHexDraft: (value: string) => void;
}

export const UsernameGradientSection = ({
    gradientEnabled,
    gradientColors,
    gradientAngle,
    activeColorPicker,
    hexDraft,
    pickerRef,
    triggerRef,
    pickerCoords,
    setGradientEnabled,
    setGradientAngle,
    addGradientColor,
    removeGradientColor,
    updateGradientColor,
    setActiveColorPicker,
    setHexDraft,
}: UsernameGradientSectionProps): React.ReactNode => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <Heading level={4}>Username Gradient</Heading>
            <Toggle
                checked={gradientEnabled}
                onCheckedChange={setGradientEnabled}
            />
        </div>

        {gradientEnabled ? (
            <div className="space-y-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                <div>
                    <span className="mb-2 block text-sm font-medium text-muted-foreground">
                        Colors (Max 20)
                    </span>
                    <div className="mb-2 flex flex-wrap gap-2">
                        {gradientColors.map((colorItem, index) => {
                            const isOpen =
                                activeColorPicker?.type === 'gradient' &&
                                activeColorPicker.index === index;
                            return (
                                <div
                                    className="group relative"
                                    key={colorItem.id}
                                >
                                    <Button
                                        className="border-border h-10 w-10 min-w-0 rounded-full border-2 p-0 shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                        style={{
                                            backgroundColor: colorItem.value,
                                        }}
                                        variant="ghost"
                                        onClick={(e): void => {
                                            triggerRef.current =
                                                e.currentTarget;
                                            setActiveColorPicker(
                                                isOpen
                                                    ? null
                                                    : {
                                                          type: 'gradient',
                                                          index,
                                                      },
                                            );
                                            if (!isOpen)
                                                setHexDraft(colorItem.value);
                                        }}
                                    >
                                        <span className="sr-only">
                                            Select color {colorItem.value}
                                        </span>
                                    </Button>
                                    <Button
                                        className="absolute -top-1 -right-1 h-4 w-4 min-w-0 rounded-full border-none bg-danger p-0.5 text-white opacity-0 shadow-none transition-opacity group-hover:opacity-100"
                                        size="sm"
                                        variant="primary"
                                        onClick={(): void => {
                                            removeGradientColor(index);
                                        }}
                                    >
                                        <X size={10} />
                                    </Button>

                                    {isOpen ? (
                                        <ColorPickerPopover
                                            color={colorItem.value}
                                            coords={pickerCoords}
                                            hexDraft={hexDraft}
                                            pickerRef={pickerRef}
                                            onChange={(c): void => {
                                                updateGradientColor(index, c);
                                            }}
                                            onClose={(): void => {
                                                setActiveColorPicker(null);
                                            }}
                                            onHexDraftChange={setHexDraft}
                                        />
                                    ) : null}
                                </div>
                            );
                        })}
                        {gradientColors.length < 20 ? (
                            <Button
                                className="border-border flex h-10 w-10 min-w-0 items-center justify-center rounded-full border-2 border-dashed p-0 text-muted-foreground shadow-none transition-colors hover:border-primary hover:text-primary"
                                variant="ghost"
                                onClick={addGradientColor}
                            >
                                <Plus size={16} />
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <span className="mb-2 block text-sm font-medium text-muted-foreground">
                            Angle (Deg)
                        </span>
                        <div className="flex items-center gap-4">
                            <input
                                aria-label="Gradient angle"
                                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-bg-secondary accent-primary"
                                max={360}
                                min={0}
                                type="range"
                                value={gradientAngle}
                                onChange={(e): void => {
                                    setGradientAngle(Number(e.target.value));
                                }}
                            />
                            <span className="min-w-[3ch] text-sm font-medium text-foreground">
                                {gradientAngle}°
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        ) : null}
    </div>
);
