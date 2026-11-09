import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from './Checkbox';

describe('Checkbox', (): void => {
    it('reports the new checked state and still calls onChange', (): void => {
        const onCheckedChange = vi.fn();
        const onChange = vi.fn();
        render(
            <Checkbox
                aria-label="Enabled"
                checked={false}
                onChange={onChange}
                onCheckedChange={onCheckedChange}
            />,
        );
        fireEvent.click(screen.getByRole('checkbox', { name: 'Enabled' }));
        expect(onCheckedChange).toHaveBeenCalledWith(true);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('wraps the box in a clickable label when given one', (): void => {
        const onCheckedChange = vi.fn();
        render(
            <Checkbox
                checked={false}
                label="Remember me"
                onCheckedChange={onCheckedChange}
            />,
        );
        fireEvent.click(screen.getByText('Remember me'));
        expect(onCheckedChange).toHaveBeenCalledWith(true);
        expect(
            screen.getByRole('checkbox', { name: 'Remember me' }),
        ).toBeInTheDocument();
    });
});
