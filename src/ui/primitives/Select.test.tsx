import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Input } from './Input';
import { Select } from './Select';

describe('Select', (): void => {
    it('renders a native select with its options and reports changes', (): void => {
        const onChange = vi.fn();
        render(
            <Select aria-label="Unit" value="m" onChange={onChange}>
                <option value="m">Minutes</option>
                <option value="h">Hours</option>
            </Select>,
        );
        const select = screen.getByRole('combobox', { name: 'Unit' });
        fireEvent.change(select, { target: { value: 'h' } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('matches the Input field look for the same variant and size', (): void => {
        render(
            <>
                <Input aria-label="text" size="sm" variant="secondary" />
                <Select aria-label="choice" size="sm" variant="secondary">
                    <option>a</option>
                </Select>
            </>,
        );
        const input = screen.getByRole('textbox', { name: 'text' });
        const select = screen.getByRole('combobox', { name: 'choice' });
        for (const prop of [
            'height',
            'borderRadius',
            'fontSize',
            'backgroundColor',
            'border',
        ]) {
            expect(
                select.style.getPropertyValue(prop) ||
                    select.style[prop as never],
            ).toBe(
                input.style.getPropertyValue(prop) ||
                    input.style[prop as never],
            );
        }
    });

    it('dims and blocks a disabled select', (): void => {
        render(
            <Select disabled aria-label="off">
                <option>a</option>
            </Select>,
        );
        const select = screen.getByRole('combobox', { name: 'off' });
        expect(select).toBeDisabled();
        expect(select).toHaveStyle({ opacity: '0.5' });
    });
});
