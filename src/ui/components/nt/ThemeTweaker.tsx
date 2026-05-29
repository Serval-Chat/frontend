import { type Theme, useTheme } from '@/providers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleThemeTweaker } from '@/store/slices/themeTweakerSlice';
import { NTButton } from '@/ui/components/nt/NTButton';
import { NTPanel } from '@/ui/components/nt/NTPanel';
import { Window } from '@/ui/components/nt/Window';

const THEMES = [
    { id: 'serval', label: 'Serval' },
    { id: 'dark', label: 'Dark' },
    { id: 'deep-ocean', label: 'Deep Ocean' },
    { id: 'light', label: 'Light' },
    { id: 'cherry', label: 'Cherry' },
    { id: 'violet', label: 'Violet' },
    { id: 'forest-green', label: 'Forest Green' },
    { id: 'high-contrast', label: 'High Contrast' },
] as const;

export const ThemeTweaker = () => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(
        (state): boolean => state.themeTweaker.isOpen,
    );
    const { theme, setTheme } = useTheme();

    if (!isOpen) return null;

    const currentIndex = THEMES.findIndex((t): boolean => t.id === theme);

    const handlePrevious = (): void => {
        const nextIndex =
            currentIndex <= 0 ? THEMES.length - 1 : currentIndex - 1;
        setTheme(THEMES[nextIndex].id as Theme);
    };

    const handleNext = (): void => {
        const nextIndex =
            currentIndex >= THEMES.length - 1 ? 0 : currentIndex + 1;
        setTheme(THEMES[nextIndex].id as Theme);
    };

    const currentThemeLabel =
        THEMES[currentIndex >= 0 ? currentIndex : 0].label;

    return (
        <Window
            defaultHeight={150}
            defaultWidth={300}
            defaultX={250}
            defaultY={250}
            icon="/icons/retro/chip.png"
            title="Theme Switcher"
            onClose={(): {
                payload: undefined;
                type: 'themeTweaker/toggleThemeTweaker';
            } => dispatch(toggleThemeTweaker())}
        >
            <div className="flex min-h-0 flex-1 flex-col bg-[#c0c0c0] p-2">
                <NTPanel
                    className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-3"
                    variant="inset"
                >
                    <div className="text-center font-bold text-black">
                        Current Theme:
                        <br />
                        {currentThemeLabel}
                    </div>
                    <div className="flex w-full justify-center gap-4">
                        <NTButton onClick={handlePrevious}>&lt; Left</NTButton>
                        <NTButton onClick={handleNext}>Right &gt;</NTButton>
                    </div>
                </NTPanel>
            </div>
        </Window>
    );
};
