import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type React from 'react';

import { ServerIcon } from './ServerIcon';
import type { Server } from '@/api/servers/servers.types';

vi.mock('@/providers/limitedAnimationsContext', () => ({
    useLimitedAnimations: () => false,
}));

vi.mock('@/ui/components/common/PausedAnimatedImage', () => ({
    PausedAnimatedImage: ({ paused, src, alt }: { paused: boolean; src: string; alt: string }) => (
        <div data-alt={alt} data-paused={paused} data-src={src} data-testid="paused-animated-image" />
    ),
}));

describe('ServerIcon', () => {
    const mockServer: Server = {
        id: '123',
        name: 'Test Server',
        icon: '/api/v1/servers/icon/test-icon.gif',
        ownerId: 'owner123',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('renders paused GIF icon when not in server and not hovered', () => {
        render(<ServerIcon animateOnlyInServerOrHover isInServer={false} server={mockServer} />);
        const img = screen.getByTestId('paused-animated-image');
        expect(img.getAttribute('data-paused')).toBe('true');
    });

    it('animates GIF icon when the server is currently active (selected)', () => {
        render(<ServerIcon animateOnlyInServerOrHover isInServer server={mockServer} />);
        const img = screen.getByTestId('paused-animated-image');
        expect(img.getAttribute('data-paused')).toBe('false');
    });

    it('animates GIF icon when hovering over the server icon', () => {
        render(<ServerIcon animateOnlyInServerOrHover isInServer={false} server={mockServer} />);
        const button = screen.getByRole('button');
        const img = screen.getByTestId('paused-animated-image');
        expect(img.getAttribute('data-paused')).toBe('true');

        fireEvent.mouseEnter(button);
        expect(img.getAttribute('data-paused')).toBe('false');

        fireEvent.mouseLeave(button);
        expect(img.getAttribute('data-paused')).toBe('true');
    });
});

describe('ServerIcon – Limited Animations accessibility setting', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    const mockServer: Server = {
        id: '456',
        name: 'Animated Server',
        icon: '/api/v1/servers/icon/animated-icon.gif',
        ownerId: 'owner456',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const renderWithLimitedAnimations = async (props: React.ComponentProps<typeof ServerIcon>) => {
        vi.doMock('@/providers/limitedAnimationsContext', () => ({
            useLimitedAnimations: () => true,
        }));
        vi.doMock('@/ui/components/common/PausedAnimatedImage', () => ({
            PausedAnimatedImage: ({ paused, alt }: { paused: boolean; alt: string }) => (
                <div data-alt={alt} data-paused={paused} data-testid="paused-animated-image" />
            ),
        }));
        const { ServerIcon: LimitedServerIcon } = await import('./ServerIcon');
        const { render: r, screen: s, fireEvent: fe } = await import('@testing-library/react');
        r(
            <LimitedServerIcon
                animateOnlyInServerOrHover={props.animateOnlyInServerOrHover}
                isInServer={props.isInServer}
                server={props.server}
            />,
        );
        return { screen: s, fireEvent: fe };
    };

    it('keeps GIF paused even when user is in the server', async () => {
        const { screen: s } = await renderWithLimitedAnimations({
            server: mockServer,
            isInServer: true,
            animateOnlyInServerOrHover: true,
        });
        const img = s.getByTestId('paused-animated-image');
        expect(img.getAttribute('data-paused')).toBe('true');
    });

    it('keeps GIF paused even when hovering over the server icon', async () => {
        const { screen: s, fireEvent: fe } = await renderWithLimitedAnimations({
            server: mockServer,
            isInServer: false,
            animateOnlyInServerOrHover: true,
        });
        const button = s.getByRole('button');
        fe.mouseEnter(button);
        const img = s.getByTestId('paused-animated-image');
        expect(img.getAttribute('data-paused')).toBe('true');
    });
});
