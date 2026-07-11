import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BotTag } from './BotTag';

describe('BotTag', (): void => {
    it('renders the BOT text', (): void => {
        render(<BotTag />);
        expect(screen.getByText('BOT')).toBeDefined();
    });

    it('applies custom className', (): void => {
        render(<BotTag className="custom-class" />);
        const tag = screen.getByText('BOT');
        expect(tag.className).toContain('custom-class');
    });

    it('does not render a checkmark when unverified', (): void => {
        render(<BotTag verified={false} />);
        expect(screen.queryByLabelText('Verified bot')).toBeNull();
    });

    it('renders a checkmark to the left of the label when verified', (): void => {
        render(<BotTag verified />);
        const checkmark = screen.getByLabelText('Verified bot');
        expect(checkmark).toBeDefined();
        const tag = screen.getByText('BOT');
        expect(tag.firstChild).toBe(checkmark);
    });

    it('does not render a checkmark for a verified webhook, since webhooks are not bots', (): void => {
        render(<BotTag verified label="WEBHOOK" />);
        expect(screen.getByText('WEBHOOK')).toBeDefined();
        expect(screen.queryByLabelText('Verified bot')).toBeNull();
    });
});
