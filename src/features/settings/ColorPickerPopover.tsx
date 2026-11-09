import { HexColorPicker } from 'react-colorful';

import { DismissableLayer } from '@/ui/primitives/DismissableLayer';
import { Text } from '@/ui/primitives/Text';

interface ColorPickerPopoverProps {
    color: string;
    hexDraft: string;
    coords: { x: number; y: number };
    pickerRef: React.RefObject<HTMLDivElement | null>;
    onChange: (hex: string) => void;
    onHexDraftChange: (draft: string) => void;
    onClose: () => void;
}

/**
 * the floating hex color picker used by the appearance settings (profile colors
 * and each gradient stop). Rendered in a portal, positioned by the caller via
 * `coords`, with a click-away/escape backdrop and a synced hex text input.
 */
export const ColorPickerPopover = ({
    color,
    hexDraft,
    coords,
    pickerRef,
    onChange,
    onHexDraftChange,
    onClose,
}: ColorPickerPopoverProps) => (
    <DismissableLayer label="Close color picker" onDismiss={onClose}>
        <div
            ref={pickerRef}
            style={{ position: 'fixed', left: coords.x, top: coords.y }}
        >
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-background shadow-xl">
                <HexColorPicker
                    color={color}
                    onChange={(c): void => {
                        onChange(c);
                        onHexDraftChange(c);
                    }}
                />
                <div className="flex items-center gap-2 bg-bg-secondary px-3 py-2">
                    <Text
                        className="font-mono select-none"
                        size="xs"
                        variant="muted"
                    >
                        #
                    </Text>
                    {/* eslint-disable-next-line no-ui/no-raw-controls-outside-primitives -- borderless field inside the swatch row's own #-prefixed chrome */}
                    <input
                        aria-label="Hex color value"
                        className="w-full bg-transparent font-mono text-xs text-foreground outline-none"
                        maxLength={6}
                        spellCheck={false}
                        type="text"
                        value={hexDraft.replace(/^#/, '')}
                        onChange={(e): void => {
                            const raw = e.target.value.replaceAll(
                                /[^0-9a-fA-F]/g,
                                '',
                            );
                            onHexDraftChange(`#${raw}`);
                            if (raw.length === 6) {
                                onChange(`#${raw}`);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    </DismissableLayer>
);
