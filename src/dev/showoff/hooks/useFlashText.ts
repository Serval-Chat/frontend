import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useFlashText(
    initialText: string,
    flashText: string,
    duration: number,
): readonly [string, () => void] {
    const [text, setText] = useState(initialText);
    const initialRef = useRef(initialText);

    useEffect((): void => {
        initialRef.current = initialText;
    }, [initialText]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    const flash = useCallback((): void => {
        clearTimeout(timeoutRef.current);
        setText(flashText);
        timeoutRef.current = setTimeout((): void => {
            setText(initialRef.current);
        }, duration);
    }, [flashText, duration]);

    useEffect(
        (): (() => void) => (): void => {
            clearTimeout(timeoutRef.current);
        },
        [],
    );

    return [text, flash] as const;
}

interface FlashConfig {
    initial: string;
    flash: string;
    duration?: number;
}

export function useFlashGroup<T extends string>(
    configs: Record<T, FlashConfig>,
): Record<T, { label: string; trigger: () => void; isFlashing: boolean }> {
    const [flashing, setFlashing] = useState<Partial<Record<T, boolean>>>({});
    const configsRef = useRef(configs);

    useEffect((): void => {
        configsRef.current = configs;
    }, [configs]);

    const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
        {},
    );

    const trigger = useCallback((key: T): void => {
        const cfg = configsRef.current[key];

        // clear existing timeout for this key
        if (timeoutsRef.current[key]) {
            clearTimeout(timeoutsRef.current[key]);
        }

        setFlashing(
            (prev): Partial<Record<T, boolean>> & Record<string, boolean> => ({
                ...prev,
                [key]: true,
            }),
        );

        timeoutsRef.current[key] = setTimeout((): void => {
            setFlashing(
                (
                    prev,
                ): Partial<Record<T, boolean>> & Record<string, boolean> => ({
                    ...prev,
                    [key]: false,
                }),
            );
            delete timeoutsRef.current[key];
        }, cfg.duration ?? 2500);
    }, []);

    // cleanup on unmount
    useEffect((): (() => void) => {
        const timeouts = timeoutsRef.current;
        return (): void => {
            Object.values(timeouts).forEach(clearTimeout);
        };
    }, []);

    const results = useMemo((): Record<
        T,
        { label: string; trigger: () => void; isFlashing: boolean }
    > => {
        const res = {} as Record<
            T,
            { label: string; trigger: () => void; isFlashing: boolean }
        >;
        for (const key in configs) {
            const k = key as T;
            const cfg = configs[k];
            const isFlashing = flashing[k] ?? false;
            const label = isFlashing ? cfg.flash : cfg.initial;
            res[k] = {
                label,
                trigger: (): void => {
                    trigger(k);
                },
                isFlashing,
            };
        }
        return res;
    }, [flashing, trigger, configs]);

    return results;
}
