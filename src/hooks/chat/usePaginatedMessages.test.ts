import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChannelMessages, useUserMessages } from '@/api/chat/chat.queries';
import { usePaginatedMessages } from '@/hooks/chat/usePaginatedMessages';

vi.mock('@/api/chat/chat.queries', () => ({
    useUserMessages: vi.fn(),
    useChannelMessages: vi.fn(),
}));

const queryResult = (
    overrides: Partial<ReturnType<typeof useChannelMessages>> = {},
): ReturnType<typeof useChannelMessages> =>
    ({
        data: undefined,
        isLoading: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchPreviousPage: vi.fn(),
        hasPreviousPage: false,
        isFetchingPreviousPage: false,
        ...overrides,
    }) as unknown as ReturnType<typeof useChannelMessages>;

describe('usePaginatedMessages', (): void => {
    beforeEach((): void => {
        vi.mocked(useUserMessages).mockReturnValue(queryResult());
        vi.mocked(useChannelMessages).mockReturnValue(queryResult());
    });

    it('is not "viewing older messages" without a jump target, even if more could be paginated', (): void => {
        vi.mocked(useChannelMessages).mockReturnValue(
            queryResult({ hasPreviousPage: true }),
        );

        const { result } = renderHook(() =>
            usePaginatedMessages(null, 'srv-1', 'ch-1', null),
        );

        expect(result.current.isViewingOlderMessages).toBe(false);
    });

    it('is "viewing older messages" once a jump target is active and the newer edge has not been reached', (): void => {
        vi.mocked(useChannelMessages).mockReturnValue(
            queryResult({ hasPreviousPage: true }),
        );

        const { result } = renderHook(() =>
            usePaginatedMessages(null, 'srv-1', 'ch-1', 'msg-target'),
        );

        expect(result.current.isViewingOlderMessages).toBe(true);
    });

    it('stops "viewing older messages" once pagination has caught up to the present', (): void => {
        vi.mocked(useChannelMessages).mockReturnValue(
            queryResult({ hasPreviousPage: false }),
        );

        const { result } = renderHook(() =>
            usePaginatedMessages(null, 'srv-1', 'ch-1', 'msg-target'),
        );

        expect(result.current.isViewingOlderMessages).toBe(false);
    });

    it('reads from the channel query for a server channel', (): void => {
        const fetchNewer = vi.fn();
        vi.mocked(useChannelMessages).mockReturnValue(
            queryResult({
                hasPreviousPage: true,
                fetchPreviousPage: fetchNewer,
                isFetchingPreviousPage: true,
            }),
        );

        const { result } = renderHook(() =>
            usePaginatedMessages(null, 'srv-1', 'ch-1', 'msg-target'),
        );

        expect(result.current.fetchNewerMessages).toBe(fetchNewer);
        expect(result.current.isFetchingNewerMessages).toBe(true);
    });

    it('reads from the user query for a DM, not the channel query', (): void => {
        const fetchNewer = vi.fn();
        vi.mocked(useUserMessages).mockReturnValue(
            queryResult({
                hasPreviousPage: true,
                fetchPreviousPage: fetchNewer,
                isFetchingPreviousPage: true,
            }),
        );
        vi.mocked(useChannelMessages).mockReturnValue(
            queryResult({
                hasPreviousPage: false,
                isFetchingPreviousPage: false,
            }),
        );

        const { result } = renderHook(() =>
            usePaginatedMessages('friend-1', null, null, 'msg-target'),
        );

        expect(result.current.fetchNewerMessages).toBe(fetchNewer);
        expect(result.current.isFetchingNewerMessages).toBe(true);
        expect(result.current.isViewingOlderMessages).toBe(true);
    });
});
