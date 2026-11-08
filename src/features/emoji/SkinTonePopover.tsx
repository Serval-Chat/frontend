import React, { useRef } from 'react';

import { m } from 'framer-motion';
import { createPortal } from 'react-dom';

import { useSmartPosition } from '@/hooks/useSmartPosition';

import { getUnicode, getSpriteStyle } from '@/utils/emoji';
import type { EmojiData } from '@/utils/emoji';
import { cn } from '@/utils/cn';

const SKIN_TONE_MODIFIERS = [
    '1F3FB', // Light
    '1F3FC', // Medium-Light
    '1F3FD', // Medium
    '1F3FE', // Medium-Dark
    '1F3FF', // Dark
] as const;

interface SkinToneTarget {
    emoji: EmojiData;
    position: { x: number; y: number };
}

interface SkinTonePopoverProps {
    target: SkinToneTarget;
    onSelect: (unicode: string) => void;
    onClose: () => void;
}

const SWATCH_SIZE = 42;
const SWATCH_ICON_SIZE = 32;

export const SkinTonePopover = ({
    target,
    onSelect,
    onClose,
}: SkinTonePopoverProps): React.ReactPortal => {
    const popoverRef = useRef<HTMLDivElement>(null);

    const smartPosition = useSmartPosition({
        isOpen: true,
        elementRef: popoverRef,
        position: target.position,
        padding: 12,
    });

    const swatches: { unicode: string; spriteData: { sheet_x: number; sheet_y: number } }[] = [
        {
            unicode: getUnicode(target.emoji),
            spriteData: target.emoji,
        },
    ];

    if (target.emoji.skin_variations) {
        for (const modifier of SKIN_TONE_MODIFIERS) {
            const sv = target.emoji.skin_variations[modifier];
            if (sv?.has_img_apple) {
                swatches.push({
                    unicode: getUnicode(sv),
                    spriteData: sv,
                });
            }
        }
    }

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent): void => {
        e.stopPropagation();
        e.nativeEvent.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    };

    const content = (
        <div>
            <button
                aria-label="Close skin tone picker"
                className="fixed inset-0 z-[99998]"
                type="button"
                onClick={onClose}
                onContextMenu={(e): void => {
                    e.preventDefault();
                    onClose();
                }}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
            />

            <m.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="z-[99999] flex items-center gap-1 rounded-2xl border border-divider bg-background p-1.5 shadow-2xl"
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                ref={popoverRef}
                style={{
                    position: 'fixed',
                    left: `${smartPosition.x}px`,
                    top: `${smartPosition.y}px`,
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
            >
                {swatches.map((swatch, i) => (
                    <button
                        aria-label={`Skin tone ${i === 0 ? 'default' : i}`}
                        className={cn(
                            'relative flex shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all duration-100',
                            'hover:scale-110 hover:bg-bg-subtle active:scale-95',
                        )}
                        key={swatch.unicode}
                        style={{ width: SWATCH_SIZE, height: SWATCH_SIZE }}
                        type="button"
                        onClick={(): void => {
                            onSelect(swatch.unicode);
                            onClose();
                        }}
                        onMouseDown={(e): void => {
                            e.preventDefault();
                            handlePointerDown(e);
                        }}
                        onTouchStart={(e): void => {
                            handlePointerDown(e);
                        }}
                    >
                        <span
                            className="relative inline-block overflow-hidden"
                            style={{ width: SWATCH_ICON_SIZE, height: SWATCH_ICON_SIZE }}
                        >
                            <span style={getSpriteStyle(swatch.spriteData)} />
                        </span>
                    </button>
                ))}
            </m.div>
        </div>
    );

    return createPortal(content, document.body);
};
