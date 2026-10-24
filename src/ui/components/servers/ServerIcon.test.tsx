import type React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Server } from '@/api/servers/servers.types';

import { ServerIcon } from './ServerIcon';

vi.mock('@/providers/limitedAnimationsContext', () => ({
    useLimitedAnimations: () => false,
}));

vi.mock('@/ui/components/common/PausedAnimatedImage', () => ({
    PausedAnimatedImage: ({
        paused,
        src,
        alt,
    }: {
        paused: boolean;
        src: string;
        alt: string;
    }) => (
        <div
            data-alt={alt}
            data-paused={paused}
            data-src={src}
            data-testid="paused-animated-image"
        />
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
        render(
            <ServerIcon
                animateOnlyInServerOrHover
                isInServer={false}
                server={mockServer}
                onClick={(): void => {}}
            />,
        );
        const img = screen.getByTestId('paused-animated-image');
        expect(img.getAttribute('data-paused')).toBe('true');
    });

    it('animates GIF icon when the server is currently active (selected)', () => {
        render(
            <ServerIcon
                animateOnlyInServerOrHover
                isInServer
                server={mockServer}
            />,
        );
        const img = screen.getByTestId('paused-animated-image');
        expect(img.getAttribute('data-paused')).toBe('false');
    });

    it('animates GIF icon when hovering over the server icon', () => {
        render(
            <ServerIcon
                animateOnlyInServerOrHover
                isInServer={false}
                server={mockServer}
                onClick={(): void => {}}
            />,
        );
        const button = screen.getByRole('button');
        const img = screen.getByTestId('paused-animated-image');
        expect(img.getAttribute('data-paused')).toBe('true');

        fireEvent.mouseEnter(button);
        expect(img.getAttribute('data-paused')).toBe('false');

        fireEvent.mouseLeave(button);
        expect(img.getAttribute('data-paused')).toBe('true');
    });

    it('renders text initials when no icon is provided', () => {
        render(<ServerIcon server={{ name: 'Alpha Beta Gamma Delta' }} />);
        expect(screen.getByText('ABG')).toBeInTheDocument();
    });

    it('safely handles emoji-prefixed server names without corrupting surrogates', () => {
        render(<ServerIcon server={{ name: '💖 💖 💖' }} />);
        expect(screen.getByText('💖💖💖')).toBeInTheDocument();
    });

    it('applies the xl size class properly instead of falling back to md', () => {
        render(
            <ServerIcon
                server={{ name: 'Large Server' }}
                size="xl"
                onClick={(): void => {}}
            />,
        );
        const button = screen.getByRole('button');
        expect(button.className).toContain('w-20');
        expect(button.className).toContain('h-20');
        expect(button.className).toContain('text-xl');
    });

    it('applies hover and contrast classes to the inner container', () => {
        const { container } = render(
            <ServerIcon server={{ name: 'Contrast Server' }} />,
        );
        const inner = container.querySelector('.bg-bg-secondary');
        expect(inner).not.toBeNull();
        expect(inner?.className).toContain('group-hover:bg-primary');
        expect(inner?.className).toContain(
            'group-hover:text-foreground-inverse',
        );
    });

    it('does not apply primary background to servers with an icon set', () => {
        const { container } = render(
            <ServerIcon
                isActive
                server={{ name: 'Icon Server', icon: '/icon.png' }}
            />,
        );
        const inner = container.querySelector('.overflow-hidden');
        expect(inner?.className).toContain('bg-transparent');
        expect(inner?.className).not.toContain('bg-primary');
        expect(inner?.className).not.toContain('group-hover:bg-primary');
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

    const renderWithLimitedAnimations = async (
        props: React.ComponentProps<typeof ServerIcon>,
    ) => {
        vi.doMock('@/providers/limitedAnimationsContext', () => ({
            useLimitedAnimations: () => true,
        }));
        vi.doMock('@/ui/components/common/PausedAnimatedImage', () => ({
            PausedAnimatedImage: ({
                paused,
                alt,
            }: {
                paused: boolean;
                alt: string;
            }) => (
                <div
                    data-alt={alt}
                    data-paused={paused}
                    data-testid="paused-animated-image"
                />
            ),
        }));
        const { ServerIcon: LimitedServerIcon } = await import('./ServerIcon');
        const {
            render: r,
            screen: s,
            fireEvent: fe,
        } = await import('@testing-library/react');
        r(
            <LimitedServerIcon
                animateOnlyInServerOrHover={props.animateOnlyInServerOrHover}
                isInServer={props.isInServer}
                server={props.server}
                onClick={props.onClick}
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
            onClick: (): void => {},
        });
        const button = s.getByRole('button');
        fe.mouseEnter(button);
        const img = s.getByTestId('paused-animated-image');
        expect(img.getAttribute('data-paused')).toBe('true');
    });
});
