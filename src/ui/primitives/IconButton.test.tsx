import { render, screen } from '@testing-library/react';
import { X } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { IconButton } from './IconButton';

describe('IconButton', (): void => {
    it('turns title into the accessible name instead of a native tooltip', (): void => {
        render(<IconButton icon={X} title="Close" />);
        const button = screen.getByRole('button', { name: 'Close' });
        expect(button).not.toHaveAttribute('title');
        expect(button.parentElement).toHaveClass('inline-flex');
    });

    it('prefers an explicit aria-label over title', (): void => {
        render(
            <IconButton aria-label="Delete row 2" icon={X} title="Delete" />,
        );
        expect(
            screen.getByRole('button', { name: 'Delete row 2' }),
        ).not.toHaveAttribute('title');
    });

    it('renders no tooltip wrapper without a title', (): void => {
        const { container } = render(
            <IconButton aria-label="Close" icon={X} />,
        );
        expect(container.firstChild).toBe(
            screen.getByRole('button', { name: 'Close' }),
        );
    });
});
