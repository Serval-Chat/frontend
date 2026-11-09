import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Pressable } from './Pressable';

describe('Pressable', (): void => {
    it('is a non-submitting button that keeps keyboard focusability', (): void => {
        const onClick = vi.fn();
        render(
            <form onSubmit={(e): void => e.preventDefault()}>
                <Pressable onClick={onClick}>row</Pressable>
            </form>,
        );
        const el = screen.getByRole('button', { name: 'row' });
        expect(el).toHaveAttribute('type', 'button');
        el.focus();
        expect(el).toHaveFocus();
        fireEvent.click(el);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('carries a visible focus ring and merges caller classes', (): void => {
        render(<Pressable className="w-full p-2">row</Pressable>);
        const el = screen.getByRole('button', { name: 'row' });
        expect(el).toHaveClass('focus-visible:outline-2', 'w-full', 'p-2');
        expect(el).not.toHaveClass('p-0');
    });

    it('does not fire clicks while disabled', (): void => {
        const onClick = vi.fn();
        render(
            <Pressable disabled onClick={onClick}>
                row
            </Pressable>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'row' }));
        expect(onClick).not.toHaveBeenCalled();
    });
});
