import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', (): void => {
    it('restores its border after hover and calls supplied mouse handlers', (): void => {
        const onMouseEnter = vi.fn();
        const onMouseLeave = vi.fn();

        render(
            <Button onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                Action
            </Button>,
        );

        const button = screen.getByRole('button');
        const originalBorderColor = button.style.borderColor;

        fireEvent.mouseEnter(button);
        expect(button.style.borderColor).toBe('var(--primary)');
        expect(onMouseEnter).toHaveBeenCalledTimes(1);

        fireEvent.mouseLeave(button);
        expect(button.style.borderColor).toBe(originalBorderColor);
        expect(onMouseLeave).toHaveBeenCalledTimes(1);
    });
});
