import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyInput, CopyTextArea } from './CopyInput';
import { PasswordInput } from './PasswordInput';

const CONFIRM_MS = 2000;

const rightInsetOf = (el: Element): string =>
    Array.from(el.classList).find((c) => c.startsWith('right-')) ?? '';

const clickCopyButton = async (name = 'Copy'): Promise<void> => {
    fireEvent.click(screen.getByRole('button', { name }));
    await act(async (): Promise<void> => undefined);
};

describe('CopyInput', (): void => {
    const writeText = vi.fn();

    beforeEach((): void => {
        writeText.mockReset();
        writeText.mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });
    });

    it('copies the displayed value when the in-field glyph is clicked', async (): Promise<void> => {
        render(<CopyInput readOnly value="https://ser.chat/invite/abc123" />);

        await clickCopyButton();

        expect(writeText).toHaveBeenCalledWith(
            'https://ser.chat/invite/abc123',
        );
    });

    it('copies copyValue instead when it differs from the displayed value', async (): Promise<void> => {
        render(
            <CopyInput
                readOnly
                copyValue="serchat_abcdef0123456789"
                value="serchat_ab••••••••••••"
            />,
        );

        await clickCopyButton();

        expect(writeText).toHaveBeenCalledWith('serchat_abcdef0123456789');
        expect(writeText).not.toHaveBeenCalledWith('serchat_ab••••••••••••');
    });

    it('reads the live value from the field when it is uncontrolled', async (): Promise<void> => {
        render(<CopyInput defaultValue="typed by hand" />);

        await clickCopyButton();

        expect(writeText).toHaveBeenCalledWith('typed by hand');
    });

    it('renders the glyph inside the field wrapper, alongside the input', (): void => {
        const { container } = render(<CopyInput readOnly value="value" />);

        const input = screen.getByRole('textbox');
        const button = screen.getByRole('button', { name: 'Copy' });

        expect(container.firstElementChild).toContainElement(button);
        expect(button.parentElement).toContainElement(input);
    });

    it('reserves room for the glyph with the same geometry as the password eye', (): void => {
        render(
            <>
                <CopyInput readOnly value="value" />
                <PasswordInput value="secret" onChange={vi.fn()} />
            </>,
        );

        const input = screen.getByDisplayValue('value');
        const passwordInput = screen.getByDisplayValue('secret');
        expect(passwordInput.style.paddingRight).not.toBe('');
        expect(input.style.paddingRight).toBe(passwordInput.style.paddingRight);

        const button = screen.getByRole('button', { name: 'Copy' });
        const eye = screen.getByRole('button', { name: 'Show password' });
        expect(rightInsetOf(eye)).not.toBe('');
        expect(rightInsetOf(button)).toBe(rightInsetOf(eye));

        const eyeWidth = eye.querySelector('svg')?.getAttribute('width');
        expect(eyeWidth).not.toBeNull();
        expect(
            button.querySelector('svg')?.getAttribute('width'),
        ).toStrictEqual(eyeWidth);
    });

    it('flips to a check mark on a successful copy and reverts afterwards', async (): Promise<void> => {
        vi.useFakeTimers();
        try {
            render(<CopyInput readOnly value="value" />);
            const button = screen.getByRole('button', { name: 'Copy' });
            expect(button).toHaveAttribute('title', 'Copy');
            expect(button).toHaveAttribute('aria-label', 'Copy');

            await clickCopyButton();
            expect(button).toHaveAttribute('title', 'Copied!');
            expect(button).toHaveAttribute('aria-label', 'Copied!');
            expect(
                document.querySelector('[aria-live="polite"]'),
            ).toHaveTextContent('Copied!');

            act((): void => {
                vi.advanceTimersByTime(CONFIRM_MS);
            });
            expect(button).toHaveAttribute('title', 'Copy');
            expect(button).toHaveAttribute('aria-label', 'Copy');
            expect(
                document.querySelector('[aria-live="polite"]'),
            ).toHaveTextContent('');
        } finally {
            vi.useRealTimers();
        }
    });

    it('surfaces a copy failure when the clipboard write is rejected', async (): Promise<void> => {
        writeText.mockRejectedValueOnce(new Error('clipboard blocked'));
        render(<CopyInput readOnly value="value" />);

        await clickCopyButton();

        const button = screen.getByRole('button', { name: 'Copy failed' });
        expect(button).toHaveAttribute('title', 'Copy failed');
        expect(button).toHaveAttribute('aria-label', 'Copy failed');
        expect(button.querySelector('svg')).toHaveClass('text-danger');
    });

    it('falls back to execCommand when the clipboard API is unavailable', async (): Promise<void> => {
        let copiedText: string | null = null;
        const execCommand = vi.fn((command: string): boolean => {
            copiedText = document.querySelector('textarea')?.value ?? null;
            return command === 'copy';
        });
        Object.defineProperty(document, 'execCommand', {
            configurable: true,
            value: execCommand,
        });
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: undefined,
        });
        try {
            render(<CopyInput readOnly value="legacy value" />);

            await clickCopyButton();

            expect(execCommand).toHaveBeenCalledWith('copy');
            expect(copiedText).toBe('legacy value');
            expect(
                screen.getByRole('button', { name: 'Copied!' }),
            ).toHaveAttribute('title', 'Copied!');
        } finally {
            Reflect.deleteProperty(document, 'execCommand');
        }
    });

    it('shows copy failed when every clipboard path fails', async (): Promise<void> => {
        writeText.mockRejectedValueOnce(new Error('denied'));
        Object.defineProperty(document, 'execCommand', {
            configurable: true,
            value: vi.fn(() => false),
        });
        try {
            render(<CopyInput readOnly value="value" />);

            await clickCopyButton();

            const button = screen.getByRole('button', { name: 'Copy failed' });
            expect(button).toHaveAttribute('title', 'Copy failed');
        } finally {
            Reflect.deleteProperty(document, 'execCommand');
        }
    });

    it('renders no copy button when copyValue is null', (): void => {
        render(<CopyInput readOnly copyValue={null} value="-" />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('-')).toBeInTheDocument();
    });

    it('lets a caller override the reserved padding entirely', (): void => {
        render(
            <CopyInput
                readOnly
                style={{ paddingRight: '4rem' }}
                value="value"
            />,
        );

        expect(screen.getByDisplayValue('value')).toHaveStyle({
            paddingRight: '4rem',
        });
    });

    it('keeps the reserved padding when the caller style omits it', (): void => {
        render(
            <CopyInput
                readOnly
                style={{ paddingLeft: '1rem' }}
                value="value"
            />,
        );

        const input = screen.getByDisplayValue('value');
        expect(input).toHaveStyle({ paddingRight: '2.5rem' });
        expect(input).toHaveStyle({ paddingLeft: '1rem' });
    });

    it('forwards field props and exposes a custom button label', (): void => {
        const { container } = render(
            <CopyInput
                readOnly
                aria-label="User token (censored)"
                className="font-mono"
                copyLabel="Copy token"
                value="secret"
                wrapperClassName="custom-wrapper"
            />,
        );

        const input = screen.getByLabelText('User token (censored)');
        expect(input).toHaveAttribute('readonly');
        expect(input).toHaveClass('font-mono');
        expect(
            screen.getByRole('button', { name: 'Copy token' }),
        ).toHaveAttribute('type', 'button');
        expect(container.firstElementChild).toHaveClass('custom-wrapper');
    });
});

describe('CopyTextArea', (): void => {
    const writeText = vi.fn();

    beforeEach((): void => {
        writeText.mockReset();
        writeText.mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });
    });

    it('copies the textarea value when the in-field glyph is clicked', async (): Promise<void> => {
        render(<CopyTextArea readOnly rows={14} value='{"a":1}' />);

        await clickCopyButton();

        expect(writeText).toHaveBeenCalledWith('{"a":1}');
    });

    it('forwards textarea props and uses copyLabel as the button name', (): void => {
        render(
            <CopyTextArea
                readOnly
                aria-label="JSON output"
                className="font-mono"
                copyLabel="Copy JSON"
                rows={14}
                value="{}"
            />,
        );

        const textArea = screen.getByLabelText('JSON output');
        expect(textArea.tagName).toBe('TEXTAREA');
        expect(textArea).toHaveAttribute('rows', '14');
        expect(textArea).toHaveClass('font-mono');
        expect(
            screen.getByRole('button', { name: 'Copy JSON' }),
        ).toBeInTheDocument();
    });

    it('places the glyph at the same right inset as the input variant', (): void => {
        const { container: inputContainer } = render(
            <CopyInput readOnly value="value" />,
        );
        const { container: textAreaContainer } = render(
            <CopyTextArea readOnly rows={4} value="{}" />,
        );

        const inputGlyph = within(inputContainer).getByRole('button', {
            name: 'Copy',
        });
        const textAreaGlyph = within(textAreaContainer).getByRole('button', {
            name: 'Copy',
        });
        expect(rightInsetOf(inputGlyph)).not.toBe('');
        expect(rightInsetOf(textAreaGlyph)).toBe(rightInsetOf(inputGlyph));
    });
});
