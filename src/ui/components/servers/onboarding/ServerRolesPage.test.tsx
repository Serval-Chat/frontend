import { fireEvent, render, screen } from '@testing-library/react';
import { useNavigate, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useOnboarding,
    useRoles,
    useUpdateSelfRoles,
} from '@/api/servers/servers.queries';
import type { Role, ServerOnboardingState } from '@/api/servers/servers.types';

import { ServerRolesPage } from './ServerRolesPage';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
    useParams: vi.fn(),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useOnboarding: vi.fn(),
    useRoles: vi.fn(),
    useUpdateSelfRoles: vi.fn(),
}));

const makeRole = (id: string, name: string, position: number): Role => ({
    id,
    serverId: 'server-1',
    name,
    color: '#ffffff',
    position,
});

const roles: Role[] = [
    makeRole('role-member', 'Member', 1),
    makeRole('role-vip', 'VIP', 2),
];

const onboardingState: ServerOnboardingState = {
    onboarding: {
        enabled: true,
        guidelines: [],
        selfAssignableRoleIds: ['role-member', 'role-vip'],
        landingChannelId: null,
        welcomeChannelIds: [],
    },
    member: {
        id: 'member-1',
        serverId: 'server-1',
        userId: 'user-1',
        roles: ['role-member'],
        joinedAt: new Date().toISOString(),
        user: {
            id: 'user-1',
            username: 'tester',
            displayName: 'Tester',
        } as ServerOnboardingState['member']['user'],
    },
};

describe('ServerRolesPage', (): void => {
    const mockMutate = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ serverId: 'server-1' });
        vi.mocked(useNavigate).mockReturnValue(vi.fn());
        vi.mocked(useRoles).mockReturnValue({ data: roles } as never);
        vi.mocked(useUpdateSelfRoles).mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as never);
    });

    it('checks roles the member already holds when onboarding data is already cached at mount', (): void => {
        vi.mocked(useOnboarding).mockReturnValue({
            data: onboardingState,
        } as never);

        render(<ServerRolesPage />);

        const memberRow = screen.getByText('Member').closest('button');
        expect(memberRow).toHaveAttribute('aria-pressed', 'true');
    });

    it('preserves the member’s pre-existing self-assignable role when saving after toggling a different role', (): void => {
        vi.mocked(useOnboarding).mockReturnValue({
            data: onboardingState,
        } as never);

        render(<ServerRolesPage />);

        fireEvent.click(screen.getByText('VIP').closest('button')!);
        fireEvent.click(
            screen.getByRole('button', { name: 'Save unsaved changes' }),
        );

        expect(mockMutate).toHaveBeenCalledWith(
            expect.arrayContaining(['role-member', 'role-vip']),
            expect.anything(),
        );
    });
});
