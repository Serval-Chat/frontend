import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BotTag } from './BotTag';

describe('BotTag', () => {
    it('renders the BOT text', () => {
        render(<BotTag />);
        expect(screen.getByText('BOT')).toBeDefined();
    });

    it('applies custom className', () => {
        render(<BotTag className="custom-class" />);
        const tag = screen.getByText('BOT');
        expect(tag.className).toContain('custom-class');
    });
});
