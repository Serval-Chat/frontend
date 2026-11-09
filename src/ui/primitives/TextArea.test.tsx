import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TextArea } from './TextArea';

describe('TextArea', (): void => {
    it('applies className to the wrapper and textareaClassName to the field', (): void => {
        render(
            <TextArea
                aria-label="Details"
                className="bg-bg-secondary"
                textareaClassName="min-h-24 font-mono"
                value=""
                onChange={vi.fn()}
            />,
        );
        const field = screen.getByRole('textbox', { name: 'Details' });
        expect(field).toHaveClass('min-h-24', 'font-mono');
        expect(field).not.toHaveClass('min-h-[40px]');
        expect(field.parentElement).toHaveClass('bg-bg-secondary');
    });

    it('keeps its default field classes when no override is given', (): void => {
        render(<TextArea aria-label="Plain" value="" onChange={vi.fn()} />);
        expect(screen.getByRole('textbox', { name: 'Plain' })).toHaveClass(
            'min-h-[40px]',
            'resize-none',
        );
    });
});
