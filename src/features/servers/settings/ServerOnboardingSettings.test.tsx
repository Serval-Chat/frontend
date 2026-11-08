import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useCategories,
    useChannels,
    useOnboardingSettings,
    useRoles,
    useUpdateOnboardingSettings,
} from '@/api/servers/servers.queries';
import type { ServerOnboardingSettings as OnboardingSettingsType } from '@/api/servers/servers.types';

import { ServerOnboardingSettings } from './ServerOnboardingSettings';

vi.mock('@/api/servers/servers.queries', () => ({
    useCategories: vi.fn().mockReturnValue({ data: [] }),
    useChannels: vi.fn().mockReturnValue({ data: [] }),
    useOnboardingSettings: vi.fn(),
    useRoles: vi.fn().mockReturnValue({ data: [] }),
    useUpdateOnboardingSettings: vi.fn(),
}));

const baseSettings: OnboardingSettingsType = {
    enabled: false,
    guidelines: ['Be nice'],
    selfAssignableRoleIds: [],
    landingChannelId: null,
    welcomeChannelIds: [],
};

describe('ServerOnboardingSettings local form state', (): void => {
    const mockMutate = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useOnboardingSettings).mockReturnValue({
            data: undefined,
            isLoading: false,
        } as never);
        vi.mocked(useUpdateOnboardingSettings).mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as never);
        vi.mocked(useRoles).mockReturnValue({ data: [] } as never);
        vi.mocked(useChannels).mockReturnValue({ data: [] } as never);
        vi.mocked(useCategories).mockReturnValue({ data: [] } as never);
    });

    // the settings query's data starts undefined (loading) and only becomes
    // available on a later render, same as ChannelList's item-sync pattern -
    // never with real data already present on mount.
    function renderOnboarding(): ReturnType<typeof render> {
        const result = render(<ServerOnboardingSettings serverId="server-1" />);
        vi.mocked(useOnboardingSettings).mockReturnValue({
            data: baseSettings,
            isLoading: false,
        } as never);
        result.rerender(<ServerOnboardingSettings serverId="server-1" />);
        return result;
    }

    it('renders the loaded settings with no pending changes', (): void => {
        renderOnboarding();
        expect(screen.getByText('1 rule')).toBeInTheDocument();
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('shows the floating bar after a change, and Reset reverts it', (): void => {
        renderOnboarding();

        fireEvent.click(screen.getByRole('checkbox'));
        expect(screen.getByText('Save Changes')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Reset'));
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('Save sends the current form state, and on success only rules/roles/channels are resynced from the response (not enabled)', (): void => {
        renderOnboarding();

        // toggle enabled locally - this should survive the save (per the
        // component's onSuccess, which deliberately doesn't touch `enabled`).
        fireEvent.click(screen.getByRole('checkbox'));
        expect(screen.getByRole('checkbox')).toBeChecked();

        fireEvent.click(screen.getByText('Save Changes'));

        expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({ enabled: true, guidelines: ['Be nice'] }),
            expect.anything(),
        );

        // simulate the server deduping/normalizing the guidelines on save.
        const [, options] = mockMutate.mock.calls[0] as [
            unknown,
            { onSuccess: (next: OnboardingSettingsType) => void },
        ];
        act((): void => {
            options.onSuccess({
                ...baseSettings,
                enabled: false, // what the server currently has, deliberately stale
                guidelines: ['Be nice', 'No spam'],
            });
        });

        expect(screen.getByText('2 rules')).toBeInTheDocument();
        // enabled stayed true locally - onSuccess doesn't overwrite it.
        expect(screen.getByRole('checkbox')).toBeChecked();
    });
});
