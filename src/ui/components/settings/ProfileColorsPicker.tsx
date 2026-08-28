import { useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useUpdateAppearance } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useSmartPosition } from '@/hooks/useSmartPosition';
import { useToast } from '@/ui/components/common/Toast';
import { cn } from '@/utils/cn';

import { ProfileColorsSection } from './ProfileColorsSection';

type ActivePicker = {
    type: 'glow' | 'gradient' | 'profilePrimary' | 'profileAccent';
    index?: number;
} | null;

interface ProfileColorsPickerProps {
    user: User;
    className?: string;
}

const AUTO_SAVE_DELAY_MS = 600;

export const ProfileColorsPicker = ({
    user,
    className,
}: ProfileColorsPickerProps) => {
    const { showToast } = useToast();
    const { mutate: updateAppearance } = useUpdateAppearance();
    const queryClient = useQueryClient();

    const [primaryColor, setPrimaryColor] = useState(
        user.profilePrimaryColor ?? null,
    );
    const [accentColor, setAccentColor] = useState(
        user.profileAccentColor ?? null,
    );
    const [activeColorPicker, setActiveColorPicker] =
        useState<ActivePicker>(null);
    const [hexDraft, setHexDraft] = useState('');

    const pickerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const originalPrimaryColor = useRef(user.profilePrimaryColor ?? null);
    const originalAccentColor = useRef(user.profileAccentColor ?? null);

    const pickerCoords = useSmartPosition({
        isOpen: !!activeColorPicker,
        elementRef: pickerRef,
        triggerRef,
        padding: 16,
        offset: 12,
    });

    useEffect((): (() => void) | undefined => {
        const hasChanged =
            primaryColor !== originalPrimaryColor.current ||
            accentColor !== originalAccentColor.current;
        if (!hasChanged) return undefined;

        queryClient.setQueryData<User>(['me'], (old) =>
            old
                ? {
                      ...old,
                      profilePrimaryColor: primaryColor ?? undefined,
                      profileAccentColor: accentColor ?? undefined,
                  }
                : old,
        );

        const timeout = setTimeout((): void => {
            updateAppearance(
                {
                    profilePrimaryColor: primaryColor,
                    profileAccentColor: accentColor,
                },
                {
                    onSuccess: (): void => {
                        originalPrimaryColor.current = primaryColor;
                        originalAccentColor.current = accentColor;
                        showToast('Profile colors updated.', 'success');
                    },
                },
            );
        }, AUTO_SAVE_DELAY_MS);

        return (): void => {
            clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [primaryColor, accentColor]);

    return (
        <div className={cn('shrink-0', className)}>
            <ProfileColorsSection
                accentColor={accentColor}
                accentWithoutPrimary={
                    accentColor !== null && primaryColor === null
                }
                activeColorPicker={activeColorPicker}
                headingClassName="text-sm font-bold text-muted-foreground uppercase"
                hexDraft={hexDraft}
                pickerCoords={pickerCoords}
                pickerRef={pickerRef}
                primaryColor={primaryColor}
                setAccentColor={setAccentColor}
                setActiveColorPicker={setActiveColorPicker}
                setHexDraft={setHexDraft}
                setPrimaryColor={setPrimaryColor}
                triggerRef={triggerRef}
            />
        </div>
    );
};
