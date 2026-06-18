import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { SearchHit } from '@/api/chat/chat.types';

import { SearchResultItem } from './MessageSearchPanel';

vi.mock('@/api/users/users.queries', () => ({
    useUserById: () => ({
        data: { id: 'u1', username: 'alice', profilePicture: undefined },
    }),
    useMe: () => ({ data: undefined }),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useSticker: () => ({ data: undefined }),
    useChannels: () => ({ data: [] }),
    useCategories: () => ({ data: [] }),
    useMembers: () => ({ data: [] }),
    useRoles: () => ({ data: [] }),
    useServerDetails: () => ({ data: undefined }),
}));

vi.mock('@/hooks/chat/useMemberMaps', () => ({
    useMemberMaps: () => ({
        fullMemberMap: undefined,
        highestRoleMap: undefined,
        iconRoleMap: undefined,
    }),
}));

vi.mock('@/ui/components/chat/MessageHeader', () => ({
    MessageHeader: ({ user }: { user: { username: string } }) => (
        <div data-testid="message-header">{user.username}</div>
    ),
}));

vi.mock('@/ui/components/embed/EmbedRenderer', () => ({
    EmbedRenderer: () => <div data-testid="embed-renderer" />,
}));

vi.mock('@/ui/components/common/UserProfilePicture', () => ({
    UserProfilePicture: () => <div data-testid="avatar" />,
}));

const makeHit = (overrides: Partial<SearchHit> = {}): SearchHit => ({
    id: 'msg-1',
    senderId: 'u1',
    text: 'hello world',
    createdAt: '2026-01-01T00:00:00.000Z',
    isWebhook: false,
    ...overrides,
});

describe('SearchResultItem', () => {
    it('wraps the matched query term in <mark> within the fully parsed message', () => {
        render(
            <SearchResultItem
                hit={makeHit({ text: 'hello world' })}
                query="lo wo"
                onNavigate={vi.fn()}
            />,
        );

        const mark = screen.getByText('lo wo');
        expect(mark.tagName).toBe('MARK');
        expect(mark.closest('.search-highlight')?.textContent).toBe(
            'hello world',
        );
    });

    it('renders text containing markup-like characters as plain text, not HTML', () => {
        render(
            <SearchResultItem
                hit={makeHit({ text: 'hello <script>alert(1)</script>' })}
                query=""
                onNavigate={vi.fn()}
            />,
        );

        expect(
            screen.getByText('hello <script>alert(1)</script>', {
                exact: false,
            }),
        ).toBeDefined();
        expect(document.querySelector('script')).toBeNull();
    });

    it('renders the message without highlighting when the query is empty', () => {
        render(
            <SearchResultItem
                hit={makeHit({ text: 'hello world' })}
                query=""
                onNavigate={vi.fn()}
            />,
        );

        expect(screen.getByText('hello world')).toBeDefined();
        expect(document.querySelector('mark')).toBeNull();
    });
});
