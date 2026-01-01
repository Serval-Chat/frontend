import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

export function useFlashText(
    initialText: string,
    flashText: string,
    duration: number
) {
    const [text, setText] = useState(initialText);
    const initialRef = useRef(initialText);

    useEffect(() => {
        initialRef.current = initialText;
    }, [initialText]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined
    );

    const flash = useCallback(() => {
        clearTimeout(timeoutRef.current);
        setText(flashText);
        timeoutRef.current = setTimeout(
            () => setText(initialRef.current),
            duration
        );
    }, [flashText, duration]);

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

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
    const [flashing, setFlashing] = useState<Partial<Record<T, boolean>>>({});
    const configsRef = useRef(configs);

    useEffect(() => {
        configsRef.current = configs;
    }, [configs]);

    const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
        {}
    );

    const trigger = useCallback((key: T) => {
        const cfg = configsRef.current[key];

        // clear existing timeout for this key
        if (timeoutsRef.current[key]) {
            clearTimeout(timeoutsRef.current[key]);
        }

        setFlashing((prev) => ({ ...prev, [key]: true }));

        timeoutsRef.current[key] = setTimeout(() => {
            setFlashing((prev) => ({ ...prev, [key]: false }));
            delete timeoutsRef.current[key];
        }, cfg.duration ?? 2500);
    }, []);

    // cleanup on unmount
    useEffect(() => {
        const timeouts = timeoutsRef.current;
        return () => {
            Object.values(timeouts).forEach(clearTimeout);
        };
    }, []);

    const results = useMemo(() => {
        const res = {} as Record<T, ReturnType<typeof useFlash>>;
        for (const key in configs) {
            const k = key as T;
            const cfg = configs[k];
            const isFlashing = flashing[k] ?? false;
            const label = isFlashing ? cfg.flash : cfg.initial;
            res[k] = {
                label,
                trigger: () => trigger(k),
                isFlashing,
            };
        }
        return res;
    }, [flashing, trigger, configs]);

    return results;
}
