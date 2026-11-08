import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PasswordInput } from './PasswordInput';

describe('PasswordInput', (): void => {
    it('masks the value by default', (): void => {
        render(<PasswordInput value="secret" onChange={vi.fn()} />);
        const input = screen.getByDisplayValue('secret');
        expect(input).toHaveAttribute('type', 'password');
    });

    it('reserves right padding so long values stop before the eye', (): void => {
        render(<PasswordInput value="secret" onChange={vi.fn()} />);

        expect(screen.getByDisplayValue('secret')).toHaveStyle({
            paddingRight: '2.5rem',
        });
    });

    it('keeps the reserved padding when a caller also passes a pr class', (): void => {
        render(
            <PasswordInput
                className="pr-16"
                value="secret"
                onChange={vi.fn()}
            />,
        );

        const input = screen.getByDisplayValue('secret');
        // Input pads via inline style, and inline beats any class, so the
        // reservation wins and pr-16 is inert. Pinned because it's surprising:
        // a caller who writes pr-16 cannot reclaim that space. Use the
        // style-prop override instead (see next test).
        expect(input).toHaveClass('pr-16');
        expect(input.style.paddingRight).toBe('2.5rem');
    });

    it('lets a caller reclaim the reserved padding via the style prop', (): void => {
        render(
            <PasswordInput
                style={{ paddingRight: '4rem' }}
                value="secret"
                onChange={vi.fn()}
            />,
        );

        expect(screen.getByDisplayValue('secret')).toHaveStyle({
            paddingRight: '4rem',
        });
    });

    it('keeps the reserved padding for a caller className without pr', (): void => {
        render(
            <PasswordInput
                className="font-mono"
                value="secret"
                onChange={vi.fn()}
            />,
        );

        const input = screen.getByDisplayValue('secret');
        expect(input).toHaveClass('font-mono');
        expect(input.style.paddingRight).toBe('2.5rem');
    });

    it('reveals and re-hides the value when the toggle is clicked', (): void => {
        render(<PasswordInput value="secret" onChange={vi.fn()} />);
        const input = screen.getByDisplayValue('secret');
        const toggle = screen.getByLabelText('Show password');

        fireEvent.click(toggle);
        expect(input).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

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
