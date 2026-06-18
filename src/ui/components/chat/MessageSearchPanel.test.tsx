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
    it('renders the ES highlight snippet with the matched term wrapped in <mark>', () => {
        render(
            <SearchResultItem
                hit={makeHit({ highlight: 'hel<mark>lo</mark> world' })}
                onNavigate={vi.fn()}
            />,
        );

        const mark = screen.getByText('lo');
        expect(mark.tagName).toBe('MARK');
        expect(screen.getByText(/hel/).textContent).toBe('hello world');
    });

    it('HTML-decodes escaped entities in the highlight instead of showing raw markup as text', () => {
        // backend escapes the source text via ES's `encoder: 'html'` option, so
        // a message containing a literal "<" arrives as "&lt;" next to our own
        // <mark> tags. Rendered as HTML, the entity must decode back to "<".
        render(
            <SearchResultItem
                hit={makeHit({
                    highlight: '<mark>hello</mark> &lt;script&gt;',
                })}
                onNavigate={vi.fn()}
            />,
        );

        expect(screen.getByText('<script>', { exact: false })).toBeDefined();
        expect(document.querySelector('script')).toBeNull();
    });

    it('falls back to the fully parsed message text when there is no highlight snippet', () => {
        render(
            <SearchResultItem
                hit={makeHit({ highlight: undefined })}
                onNavigate={vi.fn()}
            />,
        );

        expect(screen.getByText('hello world')).toBeDefined();
    });
});
