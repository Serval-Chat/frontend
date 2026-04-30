import type { LexicalEditor } from 'lexical';

import type { SlashCommand } from '@/api/interactions/interactions.api';
import type { InteractionValue } from '@/types/interactions';
import type { ToastType } from '@/ui/components/common/Toast';

import { getSlashChipPayload } from './slashChipHelpers';
import { parseSlashInput, validateSlashCommand } from './slashCommands';

interface TryExecuteSlashCommandParams {
    text: string;
    filesCount: number;
    selectedServerId: string | null;
    selectedChannelId: string | null;
    isServerRoute: boolean;
    serverCommands: SlashCommand[];
    editor?: LexicalEditor | null;
    showToast: (message: string, type?: ToastType) => void;
    createInteraction: (data: {
        command: string;
        options?: { name: string; value: InteractionValue }[];
        serverId: string;
        channelId: string;
    }) => Promise<{ success: boolean }>;
    onSuccess: () => void;
}

export const tryExecuteSlashCommand = async ({
    text,
    filesCount,
    selectedServerId,
    selectedChannelId,
    isServerRoute,
    serverCommands,
    editor,
    showToast,
    createInteraction,
    onSuccess,
}: TryExecuteSlashCommandParams): Promise<{
    handled: boolean;
    success: boolean;
}> => {
    const trimmedText = text.trim();

    const chipPayload = editor
        ? getSlashChipPayload(editor, serverCommands)
        : null;
    const isChipMode = chipPayload !== null;

    if (!isChipMode && !trimmedText.startsWith('/')) {
        return { handled: false, success: false };
    }

    if (!selectedServerId || !selectedChannelId || !isServerRoute) {
        showToast(
            'Slash commands can only be used in server channels.',
            'error',
        );
        return { handled: true, success: false };
    }
    if (filesCount > 0) {
        showToast('Slash commands cannot include file attachments.', 'error');
        return { handled: true, success: false };
    }

    if (isChipMode) {
        if (!chipPayload.ok) {
            showToast(chipPayload.error, 'error');
            return { handled: true, success: false };
        }

        try {
            await createInteraction({
                command: chipPayload.value.command,
                options: chipPayload.value.options,
                serverId: selectedServerId,
                channelId: selectedChannelId,
            });
            onSuccess();
            return { handled: true, success: true };
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to execute slash command.';
            showToast(message, 'error');
            return { handled: true, success: false };
        }
    }

    const parsed = parseSlashInput(trimmedText);
    if (!parsed) {
        showToast('Invalid slash command syntax.', 'error');
        return { handled: true, success: false };
    }

    const validated = validateSlashCommand(parsed, serverCommands);
    if (!validated.ok) {
        showToast(validated.error, 'error');
        return { handled: true, success: false };
    }

    try {
        await createInteraction({
            command: validated.value.command,
            options: validated.value.options,
            serverId: selectedServerId,
            channelId: selectedChannelId,
        });
        onSuccess();
        return { handled: true, success: true };
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Failed to execute slash command.';
        showToast(message, 'error');
        return { handled: true, success: false };
    }
};
