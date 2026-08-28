import { useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useUpdateStyle } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { StyledUserName } from '@/ui/components/common/StyledUserName';
import { useToast } from '@/ui/components/common/Toast';
import { cn } from '@/utils/cn';

import { UsernameGradientSection } from './UsernameGradientSection';

type ActivePicker = {
    type: 'glow' | 'gradient' | 'profilePrimary' | 'profileAccent';
    index?: number;
} | null;

interface GradientColorItem {
    id: string;
    value: string;
}

const mapGradientColors = (colors?: string[]): GradientColorItem[] =>
    (colors ?? []).map(
        (value): GradientColorItem => ({
            id: Math.random().toString(36),
            value,
        }),
    );

interface UsernameStylePickerProps {
    user: User;
    className?: string;
}

const AUTO_SAVE_DELAY_MS = 600;

export const UsernameStylePicker = ({
    user,
    className,
}: UsernameStylePickerProps) => {
    const { showToast } = useToast();
    const { mutate: updateStyle } = useUpdateStyle();
    const queryClient = useQueryClient();

    const [gradientEnabled, setGradientEnabled] = useState(
        user.usernameGradient?.enabled ?? false,
    );
    const [gradientColors, setGradientColors] = useState<GradientColorItem[]>(
        (): GradientColorItem[] =>
            mapGradientColors(user.usernameGradient?.colors),
    );
    const [gradientAngle, setGradientAngle] = useState(
        user.usernameGradient?.angle ?? 90,
    );
    const [activeColorPicker, setActiveColorPicker] =
        useState<ActivePicker>(null);
    const [hexDraft, setHexDraft] = useState('');

    const pickerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const originalGradientEnabled = useRef(
        user.usernameGradient?.enabled ?? false,
    );
    const originalGradientColors = useRef(user.usernameGradient?.colors ?? []);
    const originalGradientAngle = useRef(user.usernameGradient?.angle ?? 90);

    const pickerCoords = useSmartPosition({
        isOpen: !!activeColorPicker,
        elementRef: pickerRef,
        triggerRef,
        padding: 16,
        offset: 12,
    });

    const addGradientColor = (): void => {
        setGradientColors((prev): GradientColorItem[] => [
            ...prev,
            { id: Math.random().toString(36), value: '#ffffff' },
        ]);
    };

    const removeGradientColor = (index: number): void => {
        setGradientColors((prev): GradientColorItem[] =>
            prev.filter((_, i): boolean => i !== index),
        );
    };

    const updateGradientColor = (index: number, color: string): void => {
        setGradientColors((prev): GradientColorItem[] =>
            prev.map((item, i): GradientColorItem =>
                i === index ? { ...item, value: color } : item,
            ),
        );
    };

    useEffect((): (() => void) | undefined => {
        const currentColors = gradientColors.map((c): string => c.value);
        const hasChanged =
            gradientEnabled !== originalGradientEnabled.current ||
            gradientAngle !== originalGradientAngle.current ||
            JSON.stringify(currentColors) !==
                JSON.stringify(originalGradientColors.current);
        if (!hasChanged) return undefined;

        const liveGradient = {
            enabled: gradientEnabled,
            colors: currentColors,
            angle: gradientAngle,
        };

        queryClient.setQueryData<User>(['me'], (old) =>
            old ? { ...old, usernameGradient: liveGradient } : old,
        );

        const timeout = setTimeout((): void => {
            updateStyle(
                { usernameGradient: liveGradient },
                {
                    onSuccess: (): void => {
                        originalGradientEnabled.current = gradientEnabled;
                        originalGradientColors.current = currentColors;
                        originalGradientAngle.current = gradientAngle;
                        showToast('Username style updated.', 'success');
                    },
                },
            );
        }, AUTO_SAVE_DELAY_MS);

        return (): void => {
            clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gradientEnabled, gradientColors, gradientAngle]);

    const previewUser: User = {
        ...user,
        usernameGradient: {
            enabled: gradientEnabled,
            colors: gradientColors.map((c): string => c.value),
            angle: gradientAngle,
        },
    };

    return (
        <div className={cn('min-w-0 space-y-4', className)}>
            <div className="rounded-lg border border-border-subtle bg-bg-subtle p-4 text-center">
                <span className="mb-2 block text-sm font-bold text-muted-foreground uppercase">
                    Preview
                </span>
                <StyledUserName
                    className="text-lg font-bold"
                    user={previewUser}
                >
                    {user.displayName ?? user.username}
                </StyledUserName>
            </div>
            <UsernameGradientSection
                activeColorPicker={activeColorPicker}
                addGradientColor={addGradientColor}
                gradientAngle={gradientAngle}
                gradientColors={gradientColors}
                gradientEnabled={gradientEnabled}
                headingClassName="text-sm font-bold text-muted-foreground uppercase"
                hexDraft={hexDraft}
                pickerCoords={pickerCoords}
                pickerRef={pickerRef}
                removeGradientColor={removeGradientColor}
                setActiveColorPicker={setActiveColorPicker}
                setGradientAngle={setGradientAngle}
                setGradientEnabled={setGradientEnabled}
                setHexDraft={setHexDraft}
                triggerRef={triggerRef}
                updateGradientColor={updateGradientColor}
            />
        </div>
    );
};
