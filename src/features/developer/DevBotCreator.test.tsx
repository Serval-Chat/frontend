import {
    type RenderResult,
    act,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCreateBot } from '@/hooks/developer/useBots';
import type { CreateBotResponse } from '@/types/bot';
import { colors } from '@/ui/theme';

import { DevBotCreator } from './DevBotCreator';

vi.mock('@/hooks/developer/useBots', () => ({
    useCreateBot: vi.fn(),
}));

const mutate = vi.fn();

const DetailProbe = (): React.ReactElement => {
    const { clientId } = useParams<{ clientId: string }>();
    return <div data-testid="bot-detail-page">{clientId}</div>;
};

const renderPage = (): RenderResult =>
    render(
        <MemoryRouter initialEntries={['/developer/bot-creator']}>
            <Routes>
                <Route
                    element={<DevBotCreator />}
                    path="/developer/bot-creator"
                />
                <Route
                    element={<div data-testid="bots-page" />}
                    path="/developer/bots"
                />
                <Route
                    element={<DetailProbe />}
                    path="/developer/bots/:clientId"
                />
            </Routes>
        </MemoryRouter>,
    );

const typeName = (value: string): void => {
    fireEvent.change(screen.getByLabelText('Name'), {
        target: { value },
    });
};

describe('DevBotCreator', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        mutate.mockReset();
        vi.mocked(useCreateBot).mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreateBot>);
    });

    it('renders the create form instead of the bot list', (): void => {
        renderPage();

        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('My Awesome Bot'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Create' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Cancel' }),
        ).toBeInTheDocument();
    });

    it("caps the name at the backend's 32-character limit", (): void => {
        renderPage();

        expect(screen.getByLabelText('Name')).toHaveAttribute(
            'maxlength',
            '32',
        );
    });

    it('submits the trimmed name', (): void => {
        renderPage();

        typeName('  My Awesome Bot  ');
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(mutate).toHaveBeenCalledWith(
            { name: 'My Awesome Bot' },
            expect.anything(),
        );
    });

    it('does not submit a blank name', (): void => {
        renderPage();

        typeName('   ');
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(mutate).not.toHaveBeenCalled();
    });

    it('submits when Enter is pressed', (): void => {
        renderPage();

        typeName('Enter Bot');
        fireEvent.keyDown(screen.getByLabelText('Name'), {
            key: 'Enter',
        });

        expect(mutate).toHaveBeenCalledWith(
            { name: 'Enter Bot' },
            expect.anything(),
        );
    });

    it('does not submit again while a create is pending', (): void => {
        vi.mocked(useCreateBot).mockReturnValue({
            mutate,
            isPending: true,
        } as unknown as ReturnType<typeof useCreateBot>);
        renderPage();

        typeName('Pending Bot');
        fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'Enter' });
        fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'Enter' });
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(mutate).not.toHaveBeenCalled();
    });

    it('fires the create only once across rapid double clicks', (): void => {
        renderPage();

        typeName('Double Bot');
        const create = screen.getByRole('button', { name: 'Create' });
        fireEvent.click(create);
        fireEvent.click(create);

        expect(mutate).toHaveBeenCalledTimes(1);
    });

    it('re-enables submitting after a failed create', (): void => {
        mutate.mockImplementation(
            (
                _payload: unknown,
                options: { onError: (error: Error) => void },
            ): void => {
                options.onError(new Error('create failed'));
            },
        );
        renderPage();

        typeName('Retry Bot');
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(mutate).toHaveBeenCalledTimes(2);
    });

    it('shows the one-time token once the bot is created', (): void => {
        const response = {
            bot: { clientId: 'abc123' },
            token: 'serchat_onetimesecret',
        } as unknown as CreateBotResponse;
        mutate.mockImplementation(
            (
                _payload: unknown,
                options: { onSuccess: (data: CreateBotResponse) => void },
            ): void => {
                options.onSuccess(response);
            },
        );
        renderPage();

        typeName('Token Bot');
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(screen.getByText('Bot Created')).toBeInTheDocument();
        expect(
            screen.getByText(/won't be shown again.*from the bot's settings/),
        ).toBeInTheDocument();
        expect(
            screen.getByDisplayValue('serchat_onet•••••••••'),
        ).toBeInTheDocument();
        expect(screen.queryByDisplayValue('serchat_onetimesecret')).toBeNull();

        const tokenField = screen.getByLabelText('Bot token (censored)');
        expect(tokenField).toHaveStyle({
            backgroundColor: colors.cautionMuted,
            color: colors.cautionMutedText,
        });
        const copyButton = screen.getByRole('button', { name: 'Copy token' });
        const fieldWrapper = tokenField.closest('.relative');
        expect(fieldWrapper).not.toBeNull();
        expect(fieldWrapper).toContainElement(copyButton);
        expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
    });

    it('copies the full token even though the field shows it censored', async (): Promise<void> => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });
        const response = {
            bot: { clientId: 'abc123' },
            token: 'serchat_onetimesecret',
        } as unknown as CreateBotResponse;
        mutate.mockImplementation(
            (
                _payload: unknown,
                options: { onSuccess: (data: CreateBotResponse) => void },
            ): void => {
                options.onSuccess(response);
            },
        );
        renderPage();

        typeName('Token Bot');
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));
        fireEvent.click(screen.getByRole('button', { name: 'Copy token' }));
        await act(async (): Promise<void> => undefined);

        expect(writeText).toHaveBeenCalledWith('serchat_onetimesecret');
        expect(screen.queryByDisplayValue('serchat_onetimesecret')).toBeNull();
    });

    it('sizes the box to the token and caps the copy so it wraps', (): void => {
        const rectSpy = vi
            .spyOn(Element.prototype, 'getBoundingClientRect')
            .mockReturnValue({
                bottom: 0,
                height: 0,
                left: 0,
                right: 660,
                toJSON: (): object => ({}),
                top: 0,
                width: 660,
                x: 0,
                y: 0,
            } as DOMRect);
        const minWidthSpy = vi.spyOn(
            CSSStyleDeclaration.prototype,
            'minWidth',
            'set',
        );
        try {
            const response = {
                bot: { clientId: 'abc123' },
                token: 'serchat_onetimesecret',
            } as unknown as CreateBotResponse;
            mutate.mockImplementation(
                (
                    _payload: unknown,
                    options: {
                        onSuccess: (data: CreateBotResponse) => void;
                    },
                ): void => {
                    options.onSuccess(response);
                },
            );
            renderPage();

            typeName('Token Bot');
            fireEvent.click(screen.getByRole('button', { name: 'Create' }));

            expect(minWidthSpy).toHaveBeenCalledWith('min(660px, 100%)');
            expect(
                screen.getByText(
                    /won't be shown again.*from the bot's settings/,
                ),
            ).toHaveStyle({ maxWidth: '660px' });
        } finally {
            rectSpy.mockRestore();
            minWidthSpy.mockRestore();
        }
    });

    it('re-measures the token box once web fonts finish loading', async (): Promise<void> => {
        const rectSpy = vi
            .spyOn(Element.prototype, 'getBoundingClientRect')
            .mockReturnValue({
                bottom: 0,
                height: 0,
                left: 0,
                right: 660,
                toJSON: (): object => ({}),
                top: 0,
                width: 660,
                x: 0,
                y: 0,
            } as DOMRect);
        Object.defineProperty(document, 'fonts', {
            configurable: true,
            value: { ready: Promise.resolve() },
        });
        try {
            const response = {
                bot: { clientId: 'abc123' },
                token: 'serchat_onetimesecret',
            } as unknown as CreateBotResponse;
            mutate.mockImplementation(
                (
                    _payload: unknown,
                    options: {
                        onSuccess: (data: CreateBotResponse) => void;
                    },
                ): void => {
                    options.onSuccess(response);
                },
            );
            renderPage();

            typeName('Token Bot');
            fireEvent.click(screen.getByRole('button', { name: 'Create' }));

            const callsAfterCreate = rectSpy.mock.calls.length;
            expect(callsAfterCreate).toBeGreaterThan(0);

            await act(async (): Promise<void> => undefined);

            expect(rectSpy.mock.calls.length).toBeGreaterThan(callsAfterCreate);
        } finally {
            rectSpy.mockRestore();
            Reflect.deleteProperty(document, 'fonts');
        }
    });

    it('navigates back to the bot list on Cancel', (): void => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.getByTestId('bots-page')).toBeInTheDocument();
    });

    it('navigates to the new bot details page on Done after creation', (): void => {
        const response = {
            bot: { clientId: 'abc123' },
            token: 'serchat_onetimesecret',
        } as unknown as CreateBotResponse;
        mutate.mockImplementation(
            (
                _payload: unknown,
                options: { onSuccess: (data: CreateBotResponse) => void },
            ): void => {
                options.onSuccess(response);
            },
        );
        renderPage();

        typeName('Token Bot');
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));
        fireEvent.click(screen.getByRole('button', { name: 'Done' }));

        expect(screen.getByTestId('bot-detail-page')).toHaveTextContent(
            'abc123',
        );
        expect(screen.queryByTestId('bots-page')).toBeNull();
    });

    it('navigates back to the bot list from the back link', (): void => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: /Back to bots/ }));

        expect(screen.getByTestId('bots-page')).toBeInTheDocument();
    });

    it('keeps the token screen when leaving is declined', (): void => {
        const confirmSpy = vi
            .spyOn(globalThis, 'confirm')
            .mockReturnValue(false);
        try {
            mutate.mockImplementation(
                (
                    _payload: unknown,
                    options: { onSuccess: (data: CreateBotResponse) => void },
                ): void => {
                    options.onSuccess({
                        bot: { clientId: 'abc123' },
                        token: 'serchat_onetimesecret',
                    } as unknown as CreateBotResponse);
                },
            );
            renderPage();

            typeName('Token Bot');
            fireEvent.click(screen.getByRole('button', { name: 'Create' }));
            fireEvent.click(
                screen.getByRole('button', { name: /Back to bots/ }),
            );

            expect(confirmSpy).toHaveBeenCalledWith(
                expect.stringContaining('reset it later'),
            );
            expect(screen.getByText('Bot Created')).toBeInTheDocument();
            expect(screen.queryByTestId('bots-page')).toBeNull();
        } finally {
            confirmSpy.mockRestore();
        }
    });

    it('leaves the token screen once the discard is confirmed', (): void => {
        const confirmSpy = vi
            .spyOn(globalThis, 'confirm')
            .mockReturnValue(true);
        try {
            mutate.mockImplementation(
                (
                    _payload: unknown,
                    options: { onSuccess: (data: CreateBotResponse) => void },
                ): void => {
                    options.onSuccess({
                        bot: { clientId: 'abc123' },
                        token: 'serchat_onetimesecret',
                    } as unknown as CreateBotResponse);
                },
            );
            renderPage();

            typeName('Token Bot');
            fireEvent.click(screen.getByRole('button', { name: 'Create' }));
            fireEvent.click(
                screen.getByRole('button', { name: /Back to bots/ }),
            );

            expect(screen.getByTestId('bots-page')).toBeInTheDocument();
            expect(screen.queryByText('Bot Created')).toBeNull();
        } finally {
            confirmSpy.mockRestore();
        }
    });

    it('reveals the full token on request and re-censors it', (): void => {
        mutate.mockImplementation(
            (
                _payload: unknown,
                options: { onSuccess: (data: CreateBotResponse) => void },
            ): void => {
                options.onSuccess({
                    bot: { clientId: 'abc123' },
                    token: 'serchat_onetimesecret',
                } as unknown as CreateBotResponse);
            },
        );
        renderPage();

        typeName('Token Bot');
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));
        expect(
            screen.getByLabelText('Bot token (censored)'),
        ).toHaveDisplayValue('serchat_onet•••••••••');

        fireEvent.click(screen.getByRole('button', { name: 'Show token' }));
        expect(screen.getByLabelText('Bot token')).toHaveDisplayValue(
            'serchat_onetimesecret',
        );

        fireEvent.click(screen.getByRole('button', { name: 'Hide token' }));
        expect(
            screen.getByLabelText('Bot token (censored)'),
        ).toHaveDisplayValue('serchat_onet•••••••••');
        expect(screen.queryByLabelText('Bot token')).toBeNull();
    });
});
