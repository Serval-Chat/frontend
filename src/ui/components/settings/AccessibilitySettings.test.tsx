import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMe, useUpdateSettings } from '@/api/users/users.queries';

import { AccessibilitySettings } from './AccessibilitySettings';

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn(),
    useUpdateSettings: vi.fn(),
}));

const baseUser = {
    id: 'user-1',
    settings: {
        disableCustomUsernameFonts: false,
        disableCustomUsernameColors: false,
        disableCustomUsernameGlow: false,
        limitedAnimations: false,
        showUsersPronouns: false,
    },
};

describe('AccessibilitySettings local-override state', (): void => {
    const mockMutate = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useMe).mockReturnValue({
            data: baseUser,
            isLoading: false,
        } as never);
        vi.mocked(useUpdateSettings).mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as never);
    });

    it('hides the floating save bar with no local changes', (): void => {
        render(<AccessibilitySettings />);
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('shows the floating bar after a toggle, and hides it again when toggled back to the server value', (): void => {
        render(<AccessibilitySettings />);
        const [fontsToggle] = screen.getAllByRole('checkbox');

        fireEvent.click(fontsToggle!);
        expect(screen.getByText('Save Changes')).toBeInTheDocument();

        fireEvent.click(fontsToggle!);
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('Reset reverts all toggled fields to the server values', (): void => {
        render(<AccessibilitySettings />);
        const [fontsToggle, colorsToggle] = screen.getAllByRole('checkbox');

        fireEvent.click(fontsToggle!);
        fireEvent.click(colorsToggle!);
        expect(fontsToggle).toBeChecked();
        expect(colorsToggle).toBeChecked();

        fireEvent.click(screen.getByText('Reset'));

        expect(fontsToggle).not.toBeChecked();
        expect(colorsToggle).not.toBeChecked();
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('Save sends the merged settings and clears local overrides on success', (): void => {
        mockMutate.mockImplementation(
            (_data: unknown, options?: { onSuccess?: () => void }): void => {
                options?.onSuccess?.();
            },
        );

        render(<AccessibilitySettings />);
        const [fontsToggle, , glowToggle] = screen.getAllByRole('checkbox');

        fireEvent.click(fontsToggle!);
        fireEvent.click(glowToggle!);
        fireEvent.click(screen.getByText('Save Changes'));

        expect(mockMutate).toHaveBeenCalledWith(
            {
                disableCustomUsernameFonts: true,
                disableCustomUsernameColors: false,
                disableCustomUsernameGlow: true,
                limitedAnimations: false,
                showUsersPronouns: false,
            },
            expect.anything(),
        );

        // onSuccess cleared the local overrides, so the bar goes away even
        // though the mocked useMe() data hasn't actually changed.
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });
});
