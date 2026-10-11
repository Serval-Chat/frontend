import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useBot,
    useBotServers,
    useDeleteBot,
    useRequestBotVerification,
    useResetBotToken,
    useUpdateBot,
    useUpdateBotPermissions,
    useUploadBotBanner,
    useUploadBotPicture,
} from '@/hooks/developer/useBots';
import type { Bot, BotUser } from '@/types/bot';
import { permissionsToBitmask } from '@/utils/botPermissions';

import { DevBotDetail } from './DevBotDetail';

vi.mock('@/hooks/developer/useBots', () => ({
    useBot: vi.fn(),
    useBotServers: vi.fn(),
    useDeleteBot: vi.fn(),
    useRequestBotVerification: vi.fn(),
    useResetBotToken: vi.fn(),
    useUpdateBot: vi.fn(),
    useUpdateBotPermissions: vi.fn(),
    useUploadBotBanner: vi.fn(),
    useUploadBotPicture: vi.fn(),
}));

vi.mock('@/ui/components/profile/UserProfileCard', () => ({
    UserProfileCard: (): React.ReactNode => (
        <div data-testid="profile-preview" />
    ),
}));

vi.mock('@/ui/components/settings/ImageCropModal', () => ({
    ImageCropModal: (): React.ReactNode => null,
}));

const CLIENT_ID = '111222333444555666';

const makeBotUser = (): BotUser => ({
    id: 'user1',
    username: 'helperbot',
    displayName: 'Helper Bot',
    bio: 'A helpful bot',
    isBot: true,
    botVerified: false,
    createdAt: new Date().toISOString(),
});

const makeBot = (): Bot =>
    ({
        id: 'bot1',
        clientId: CLIENT_ID,
        ownerId: 'owner1',
        userId: makeBotUser(),
        botPermissions: { readMessages: true, sendMessages: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        verified: false,
        verificationRequested: false,
        verificationOverride: null,
    }) as unknown as Bot;

const pendingMutation = { isPending: false, mutate: vi.fn() };

const renderDetail = (): void => {
    // The detail only syncs form state once the bot id diverges from the
    // initially-captured key, so data must arrive after the first render,
    // mirroring react-query, which starts with no data.
    vi.mocked(useBot).mockReturnValue({
        data: undefined,
        isLoading: true,
    } as never);
    const { rerender } = render(
        <DevBotDetail clientId={CLIENT_ID} onBack={vi.fn()} />,
    );

    vi.mocked(useBot).mockReturnValue({
        data: makeBot(),
        isLoading: false,
    } as never);
    rerender(<DevBotDetail clientId={CLIENT_ID} onBack={vi.fn()} />);
};

describe('DevBotDetail - copy fields', (): void => {
    const writeText = vi.fn();

    const copyViaGlyph = async (input: HTMLElement): Promise<void> => {
        const wrapper = input.closest('div.relative');
        expect(wrapper).not.toBeNull();
        fireEvent.click(
            within(wrapper as HTMLElement).getByRole('button', {
                name: 'Copy',
            }),
        );
        await act(async (): Promise<void> => undefined);
    };

    beforeEach((): void => {
        vi.clearAllMocks();
        writeText.mockReset();
        writeText.mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });

        vi.mocked(useBot).mockReturnValue({
            data: makeBot(),
            isLoading: false,
        } as never);
        vi.mocked(useBotServers).mockReturnValue({
            data: { count: 1 },
        } as never);
        vi.mocked(useUpdateBot).mockReturnValue(pendingMutation as never);
        vi.mocked(useUploadBotPicture).mockReturnValue(
            pendingMutation as never,
        );
        vi.mocked(useUploadBotBanner).mockReturnValue(pendingMutation as never);
        vi.mocked(useResetBotToken).mockReturnValue(pendingMutation as never);
        vi.mocked(useDeleteBot).mockReturnValue(pendingMutation as never);
        vi.mocked(useRequestBotVerification).mockReturnValue(
            pendingMutation as never,
        );
        vi.mocked(useUpdateBotPermissions).mockReturnValue(
            pendingMutation as never,
        );
    });

    const expectedInviteUrl = (): string =>
        `${globalThis.location.origin}/authorize?client_id=${CLIENT_ID}&permissions=${permissionsToBitmask(
            { readMessages: true, sendMessages: true },
        )}`;

    it('renders the invite link as a single read-only field', (): void => {
        renderDetail();

        expect(screen.getByDisplayValue(expectedInviteUrl())).toHaveAttribute(
            'readonly',
        );
    });

    it('selects the whole link when the field is clicked', (): void => {
        renderDetail();

        const input = screen.getByDisplayValue(
            expectedInviteUrl(),
        ) as HTMLInputElement;
        fireEvent.click(input);

        expect(input.selectionStart).toBe(0);
        expect(input.selectionEnd).toBe(input.value.length);
    });

    it('copies the invite link through the in-field glyph', async (): Promise<void> => {
        renderDetail();

        await copyViaGlyph(screen.getByDisplayValue(expectedInviteUrl()));

        expect(writeText).toHaveBeenCalledWith(expectedInviteUrl());
    });

    it('copies the client id through its in-field glyph', async (): Promise<void> => {
        renderDetail();

        await copyViaGlyph(screen.getByDisplayValue(CLIENT_ID));

        expect(writeText).toHaveBeenCalledWith(CLIENT_ID);
    });

    it('copies a freshly reset token through its in-field glyph', async (): Promise<void> => {
        const NEW_TOKEN = 'serchat_brandnewtoken1234';
        vi.mocked(useResetBotToken).mockReturnValue({
            isPending: false,
            mutate: vi.fn(
                (
                    _vars: unknown,
                    opts: { onSuccess: (d: { token: string }) => void },
                ): void => {
                    opts.onSuccess({ token: NEW_TOKEN });
                },
            ),
        } as never);

        renderDetail();
        fireEvent.click(
            screen.getByRole('button', { name: /Reset Bot Token/ }),
        );

        await copyViaGlyph(screen.getByDisplayValue(NEW_TOKEN));

        expect(writeText).toHaveBeenCalledWith(NEW_TOKEN);
    });
});
