import type React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChannelIcon } from './ChannelIcon';

vi.mock('@/ui/utils/iconMap', () => ({
    ICON_MAP: {
        megaphone: (props: React.SVGProps<SVGSVGElement>) => (
            <svg data-testid="configured-channel-icon" {...props} />
        ),
    },
}));

vi.mock('@/ui/components/common/ParsedEmoji', () => ({
    ParsedEmoji: ({ emojiId }: { emojiId: string }) => (
        <span data-testid="custom-channel-emoji">{emojiId}</span>
    ),
}));

vi.mock('@/ui/components/common/ParsedUnicodeEmoji', () => ({
    ParsedUnicodeEmoji: ({ content }: { content: string }) => (
        <span data-testid="unicode-channel-emoji">{content}</span>
    ),
}));

describe('ChannelIcon', (): void => {
    it('renders configured custom channel icons', (): void => {
        render(<ChannelIcon icon="megaphone" type="text" />);

        expect(screen.getByTestId('configured-channel-icon')).toBeTruthy();
    });

    it('renders channel emoji ahead of configured icons', (): void => {
        render(
            <ChannelIcon
                emoji="wave"
                emojiType="custom"
                icon="megaphone"
                type="text"
            />,
        );

        expect(screen.getByTestId('custom-channel-emoji').textContent).toBe(
            'wave',
        );
        expect(screen.queryByTestId('configured-channel-icon')).toBeNull();
    });

    it('ignores configured icons for link channels', (): void => {
        const { container } = render(
            <ChannelIcon icon="megaphone" type="link" />,
        );

        expect(screen.queryByTestId('configured-channel-icon')).toBeNull();
        expect(container.querySelector('svg')).toBeTruthy();
    });
});
