import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PasswordInput } from './PasswordInput';

describe('PasswordInput', (): void => {
    it('masks the value by default', (): void => {
        render(<PasswordInput value="secret" onChange={vi.fn()} />);
        const input = screen.getByDisplayValue('secret');
        expect(input).toHaveAttribute('type', 'password');
    });

    it('reveals and re-hides the value when the toggle is clicked', (): void => {
        render(<PasswordInput value="secret" onChange={vi.fn()} />);
        const input = screen.getByDisplayValue('secret');
        const toggle = screen.getByLabelText('Show password');

        fireEvent.click(toggle);
        expect(input).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText('Hide password')).toBeDefined();

        fireEvent.click(screen.getByLabelText('Hide password'));
        expect(input).toHaveAttribute('type', 'password');
    });

    it('does not submit the enclosing form when the toggle is clicked', (): void => {
        render(<PasswordInput value="secret" onChange={vi.fn()} />);
        const toggle = screen.getByLabelText('Show password');
        expect(toggle).toHaveAttribute('type', 'button');
    });

    it('forwards other input props through to the underlying input', (): void => {
        render(
            <PasswordInput
                name="password"
                placeholder="Password"
                value="secret"
                onChange={vi.fn()}
            />,
        );
        const input = screen.getByPlaceholderText('Password');
        expect(input).toHaveAttribute('name', 'password');
    });

    it('applies wrapperClassName to the outer wrapper', (): void => {
        const { container } = render(
            <PasswordInput
                value="secret"
                wrapperClassName="custom-wrapper"
                onChange={vi.fn()}
            />,
        );
        expect(container.firstChild).toHaveClass('custom-wrapper');
    });
});
