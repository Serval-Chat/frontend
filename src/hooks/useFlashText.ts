import { useState } from 'react';

export function useFlashText(
    initialText: string,
    flashText: string,
    duration: number
) {
    const [text, setText] = useState(initialText);

    const flash = () => {
        const oldText = text;
        setText(flashText);
        setTimeout(() => setText(oldText), duration);
    };

    return [text, flash] as const;
}

export function useFlash(text: string, flash: string, duration: number = 2500) {
    const [label, trigger] = useFlashText(text, flash, duration);
    return { label, trigger, isFlashing: label === flash };
}

type FlashConfig = {
    initial: string;
    flash: string;
    duration?: number;
};

export function useFlashGroup<T extends string>(
    configs: Record<T, FlashConfig>
) {
    const entries = Object.entries(configs) as [T, FlashConfig][];
    const results = {} as Record<T, ReturnType<typeof useFlash>>;

    for (const [key, cfg] of entries) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        results[key] = useFlash(cfg.initial, cfg.flash, cfg.duration ?? 2500);
    }

    return results;
}
