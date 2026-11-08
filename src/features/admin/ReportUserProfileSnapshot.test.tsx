import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReportUserProfileSnapshot as Snapshot } from '@/api/reports/reports.api';
import type { User } from '@/api/users/users.types';

import { ReportUserProfileSnapshot } from './ReportUserProfileSnapshot';

vi.mock('@/features/users/profile/UserProfileCard', () => ({
    UserProfileCard: ({
        adminView,
        customStatus,
        hideActions,
        ignoreLivePresence,
        presenceStatus,
        user,
    }: {
        adminView?: boolean;
        customStatus?: { text?: string };
        hideActions?: boolean;
        ignoreLivePresence?: boolean;
        presenceStatus?: string;
        user?: Partial<User>;
    }) => (
        <div
            data-admin-view={String(adminView)}
            data-badge={user?.badges?.[0]?.name}
            data-bio={user?.bio}
            data-connection={user?.connections?.[0]?.value}
            data-custom-status={customStatus?.text}
            data-hide-actions={String(hideActions)}
            data-ignore-live-presence={String(ignoreLivePresence)}
            data-presence-override={presenceStatus}
            data-testid="shared-profile-card"
            data-user={JSON.stringify(user)}
        />
    ),
}));

describe('ReportUserProfileSnapshot', () => {
    beforeEach(() => {
        vi.stubGlobal('IntersectionObserver', undefined);
    });

    afterEach(() => vi.unstubAllGlobals());

    it('passes the saved profile data to the shared admin profile card', () => {
        const snapshot: Snapshot = {
            username: 'alice',
            displayName: 'Alice',
            usernameFont: 'Audiowide',
            usernameGradient: {
                enabled: true,
                colors: ['#112233', '#445566'],
                angle: 42,
            },
            usernameGlow: {
                enabled: true,
                color: '#778899',
                intensity: 7,
            },
            bio: 'Saved bio',
            pronouns: 'she/her',
            customStatus: { text: 'Saved status' },
            presenceStatus: 'idle',
            isBot: true,
            botVerified: true,
            decorationId: 'decoration-1',
            bannerColor: '#123456',
            profilePrimaryColor: '#234567',
            profileAccentColor: '#345678',
            createdAt: '2025-01-01T00:00:00.000Z',
            profilePictureAvailable: false,
            bannerAvailable: false,
            connections: [
                { id: 'connection-1', type: 'Website', value: 'example.com' },
            ],
            badges: [
                {
                    id: 'badge-1',
                    name: 'Contributor',
                    description: 'Contributor badge',
                    icon: 'star',
                    color: '#ffffff',
                    createdAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            privacySettings: {
                privateProfile: true,
                hideDisplayName: true,
                hidePronouns: true,
                hideConnections: true,
                hideBio: true,
                hideStatus: true,
            },
        };

        render(
            <ReportUserProfileSnapshot
                reportId="100000000000000001"
                snapshot={snapshot}
                targetUserId="200000000000000002"
            />,
        );

        const card = screen.getByTestId('shared-profile-card');
        expect(card).toHaveAttribute('data-admin-view', 'true');
        expect(card).toHaveAttribute('data-hide-actions', 'true');
        expect(card).toHaveAttribute('data-ignore-live-presence', 'true');
        expect(card).toHaveAttribute('data-custom-status', 'Saved status');
        expect(card).toHaveAttribute('data-presence-override', 'idle');
        expect(JSON.parse(card.getAttribute('data-user') ?? '{}')).toEqual({
            id: '200000000000000002',
            username: 'alice',
            displayName: 'Alice',
            bannerColor: '#123456',
            profilePrimaryColor: '#234567',
            profileAccentColor: '#345678',
            usernameFont: 'Audiowide',
            usernameGradient: {
                enabled: true,
                colors: ['#112233', '#445566'],
                angle: 42,
            },
            usernameGlow: {
                enabled: true,
                color: '#778899',
                intensity: 7,
            },
            presenceStatus: 'idle',
            bio: 'Saved bio',
            pronouns: 'she/her',
            createdAt: '2025-01-01T00:00:00.000Z',
            isBot: true,
            botVerified: true,
            decorationId: 'decoration-1',
            badges: [
                {
                    id: 'badge-1',
                    name: 'Contributor',
                    description: 'Contributor badge',
                    icon: 'star',
                    color: '#ffffff',
                    createdAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            privacySettings: {
                privateProfile: true,
                hideDisplayName: true,
                hidePronouns: true,
                hideConnections: true,
                hideBio: true,
                hideStatus: true,
            },
            connections: [
                {
                    id: 'connection-1',
                    type: 'Website',
                    value: 'example.com',
                },
            ],
        });
    });
});
