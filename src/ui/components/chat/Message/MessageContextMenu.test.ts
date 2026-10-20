import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@/api/users/users.types';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import type { ContextMenuItem } from '@/ui/components/common/ContextMenu';

import { useMessageContextMenu } from './MessageContextMenu';

type MenuParams = Parameters<typeof useMessageContextMenu>[0];

const makeUser = (overrides: Partial<User> = {}): User =>
    ({
        id: '200000000000000001',
        username: 'alice',
        displayName: 'Alice',
        isBot: false,
        ...overrides,
    }) as User;

const makeMessage = (
    overrides: Partial<ProcessedChatMessage> = {},
): ProcessedChatMessage => ({
    id: '200000000000000002',
    text: 'hello',
    createdAt: '2026-01-01T00:00:00.000Z',
    senderId: '200000000000000003',
    serverId: '200000000000000004',
    channelId: '200000000000000005',
    stickerId: null,
    isEdited: false,
    isPinned: false,
    isSticky: false,
    isWebhook: false,
    embeds: [],
    attachments: [],
    reactions: [],
    interaction: null,
    poll: null,
    senderIsBot: false,
    user: makeUser({ id: '200000000000000003' }),
    ...overrides,
});

const makeParams = (overrides: Partial<MenuParams> = {}): MenuParams => ({
    message: makeMessage(),
    user: makeUser(),
    isMessageSender: false,
    canEdit: false,
    canDelete: false,
    canPin: false,
    canReact: true,
    friends: [],
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTogglePin: vi.fn(),
    onToggleSticky: vi.fn(),
    onRemoveFriend: vi.fn(),
    onAddFriend: vi.fn(),
    onShowPicker: vi.fn(),
    allServerRoles: [],
    canManageRoles: true,
    onAddRole: vi.fn(),
    onRemoveRole: vi.fn(),
    canBan: true,
    canKick: true,
    canTimeout: true,
    isHigherHierarchy: true,
    onBan: vi.fn(),
    onKick: vi.fn(),
    onTimeout: vi.fn(),
    ...overrides,
});

const labelsOf = (items: ContextMenuItem[]): string[] =>
    items.flatMap((item): string[] =>
        'label' in item && typeof item.label === 'string' ? [item.label] : [],
    );

describe('useMessageContextMenu', (): void => {
    const webhookMessage = makeMessage({
        isWebhook: true,
        user: makeUser({
            id: 'webhook-200000000000000002',
            username: 'CI Bot',
        }),
    });

    it('offers moderation and friend actions on an ordinary server message', (): void => {
        const { result } = renderHook(() =>
            useMessageContextMenu(makeParams()),
        );
        const labels = labelsOf(result.current);

        expect(labels).toEqual(
            expect.arrayContaining([
                'Timeout Member',
                'Kick Member',
                'Ban Member',
                'Add Friend',
            ]),
        );
    });

    it('hides moderation and friend actions on webhook messages', (): void => {
        const { result } = renderHook(() =>
            useMessageContextMenu(
                makeParams({
                    message: webhookMessage,
                    user: webhookMessage.user,
                }),
            ),
        );
        const labels = labelsOf(result.current);

        expect(labels).not.toContain('Timeout Member');
        expect(labels).not.toContain('Kick Member');
        expect(labels).not.toContain('Ban Member');
        expect(labels).not.toContain('Add Friend');
        expect(labels).not.toContain('Remove Friend');
        expect(labels).toContain('Copy Message ID');
    });

    it('hides role management on webhook messages', (): void => {
        const { result } = renderHook(() =>
            useMessageContextMenu(
                makeParams({
                    message: webhookMessage,
                    user: webhookMessage.user,
                    allServerRoles: [
                        {
                            id: '200000000000000006',
                            serverId: '200000000000000004',
                            name: 'Moderators',
                            color: null,
                            position: 3,
                        },
                    ],
                }),
            ),
        );

        expect(labelsOf(result.current)).not.toContain('Roles');
    });
});
