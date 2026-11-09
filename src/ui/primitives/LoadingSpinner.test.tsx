import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', (): void => {
    it('defaults to a medium primary ring', (): void => {
        const { container } = render(<LoadingSpinner />);
        expect(container.firstChild).toHaveClass(
            'animate-spin',
            'border-primary',
            'border-t-transparent',
            'w-5',
            'h-5',
        );
    });

    it('applies size and tone', (): void => {
        const { container } = render(
            <LoadingSpinner size="xl" tone="current" />,
        );
        const spinner = container.firstChild;
        expect(spinner).toHaveClass(
            'w-12',
            'h-12',
            'border-4',
            'border-current',
        );
        expect(spinner).not.toHaveClass('border-primary');
    });

    it('keeps the transparent top segment when tone changes', (): void => {
        const { container } = render(<LoadingSpinner tone="muted" />);
        expect(container.firstChild).toHaveClass(
            'border-muted-foreground',
            'border-t-transparent',
        );
    });
});
