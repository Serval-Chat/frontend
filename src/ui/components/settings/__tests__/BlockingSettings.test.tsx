import {
    QueryClient,
    QueryClientProvider,
    type UseMutationResult,
    type UseQueryResult,
} from '@tanstack/react-query';
import {
    type RenderResult,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as blocksQueries from '@/api/blocks/blocks.queries';
import { BlockingSettings } from '@/ui/components/settings/BlockingSettings';

vi.mock('@/api/blocks/blocks.queries');
vi.mock('@/ui/components/common/UserItem', () => ({
    UserItem: ({ userId }: { userId: string }) => (
        <div data-testid={`user-item-${userId}`}>User {userId}</div>
    ),
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const renderComponent = (): RenderResult =>
    render(
        <QueryClientProvider client={queryClient}>
            <BlockingSettings />
        </QueryClientProvider>,
    );

describe('BlockingSettings', (): void => {
    const mockUpsertBlock = vi.fn();
    const mockRemoveBlock = vi.fn();
    const mockCreateProfile = vi.fn();
    const mockUpdateProfile = vi.fn();
    const mockDeleteProfile = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();

        vi.mocked(blocksQueries.useBlocks).mockReturnValue({
            data: [],
            isLoading: false,
        } as any as UseQueryResult<blocksQueries.BlockRelationship[]>);

        vi.mocked(blocksQueries.useBlockProfiles).mockReturnValue({
            data: [{ id: 'default-profile-id', name: 'Default', flags: 0 }],
            isLoading: false,
        } as any as UseQueryResult<blocksQueries.BlockProfile[]>);

        vi.mocked(blocksQueries.useUpsertBlock).mockReturnValue({
            mutate: mockUpsertBlock,
        } as any as UseMutationResult<
            blocksQueries.BlockRelationship,
            Error,
            { targetUserId: string; profileId: string }
        >);
        vi.mocked(blocksQueries.useRemoveBlock).mockReturnValue({
            mutate: mockRemoveBlock,
        } as any as UseMutationResult<void, Error, string>);
        vi.mocked(blocksQueries.useCreateBlockProfile).mockReturnValue({
            mutate: mockCreateProfile,
        } as any as UseMutationResult<
            blocksQueries.BlockProfile,
            Error,
            { name: string; flags: number }
        >);
        vi.mocked(blocksQueries.useUpdateBlockProfile).mockReturnValue({
            mutate: mockUpdateProfile,
        } as any as UseMutationResult<
            blocksQueries.BlockProfile,
            Error,
            { id: string; data: { name?: string; flags?: number } }
        >);
        vi.mocked(blocksQueries.useDeleteBlockProfile).mockReturnValue({
            mutate: mockDeleteProfile,
        } as any as UseMutationResult<void, Error, string>);
    });

    describe('Users Tab', (): void => {
        it('renders empty state when no blocks exist', (): void => {
            renderComponent();
            expect(
                screen.getByText("You haven't blocked anyone yet."),
            ).toBeInTheDocument();
        });

        it('renders blocked users list with assigned profile select', (): void => {
            vi.mocked(blocksQueries.useBlocks).mockReturnValue({
                data: [
                    {
                        targetUserId: 'user-1',
                        targetUsername: 'Alice',
                        profileId: 'default-profile-id',
                        flags: 0,
                    },
                ],
                isLoading: false,
            } as any as UseQueryResult<blocksQueries.BlockRelationship[]>);

            renderComponent();

            expect(screen.getByText('Blocked Users (1)')).toBeInTheDocument();
            expect(screen.getByTestId('user-item-user-1')).toBeInTheDocument();
            expect(
                screen.getByTitle('Assigned Block Profile'),
            ).toBeInTheDocument();
        });

        it('removes block when unblock clicked', (): void => {
            vi.mocked(blocksQueries.useBlocks).mockReturnValue({
                data: [
                    {
                        targetUserId: 'user-1',
                        targetUsername: 'Alice',
                        profileId: 'p1',
                        flags: 0,
                    },
                ],
                isLoading: false,
            } as any as UseQueryResult<blocksQueries.BlockRelationship[]>);

            renderComponent();

            const unblockBtn = screen.getByTitle('Unblock');
            fireEvent.click(unblockBtn);

            expect(mockRemoveBlock).toHaveBeenCalledWith('user-1');
        });

        it('filters the list based on search query', (): void => {
            vi.mocked(blocksQueries.useBlocks).mockReturnValue({
                data: [
                    {
                        targetUserId: 'user-1',
                        targetUsername: 'Alice',
                        profileId: 'p1',
                        flags: 0,
                    },
                    {
                        targetUserId: 'user-2',
                        targetUsername: 'Bob',
                        profileId: 'p2',
                        flags: 0,
                    },
                ],
                isLoading: false,
            } as any as UseQueryResult<blocksQueries.BlockRelationship[]>);

            renderComponent();

            expect(screen.getByTestId('user-item-user-1')).toBeInTheDocument();
            expect(screen.getByTestId('user-item-user-2')).toBeInTheDocument();

            const searchInput = screen.getByPlaceholderText(
                'Search blocked users...',
            );
            fireEvent.change(searchInput, { target: { value: 'bob' } });

            expect(
                screen.queryByTestId('user-item-user-1'),
            ).not.toBeInTheDocument();
            expect(screen.getByTestId('user-item-user-2')).toBeInTheDocument();
        });
    });

    describe('Profiles Tab', (): void => {
        it('switches to profiles tab and renders created profiles', (): void => {
            renderComponent();

            fireEvent.click(screen.getByText('Block Profiles'));

            expect(
                screen.getByText('Configured Profiles (1)'),
            ).toBeInTheDocument();
            expect(screen.getByText('Default')).toBeInTheDocument();
        });

        it('creates a new profile', (): void => {
            renderComponent();
            fireEvent.click(screen.getByText('Block Profiles'));

            const createBtn = screen.getByText('Create Profile');
            fireEvent.click(createBtn);

            expect(mockCreateProfile).toHaveBeenCalledWith({
                name: 'New Profile 2',
                flags: expect.any(Number),
            });
        });

        it('renames a profile', (): void => {
            renderComponent();
            fireEvent.click(screen.getByText('Block Profiles'));

            const renameBtn = screen.getByTitle('Rename Profile');
            fireEvent.click(renameBtn);

            const input = screen.getByTitle('Rename Profile') as HTMLInputElement;
            expect(input.value).toBe('Default');

            fireEvent.change(input, { target: { value: 'Strict' } });
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

            expect(mockUpdateProfile).toHaveBeenCalledWith({
                id: 'default-profile-id',
                data: { name: 'Strict' },
            });
        });

        it('deletes a profile safely', (): void => {
            vi.mocked(blocksQueries.useBlockProfiles).mockReturnValue({
                data: [
                    { id: 'p1', name: 'Profile 1', flags: 0 },
                    { id: 'p2', name: 'Profile 2', flags: 0 },
                ],
                isLoading: false,
            } as any as UseQueryResult<blocksQueries.BlockProfile[]>);

            renderComponent();
            fireEvent.click(screen.getByText('Block Profiles'));

            const deleteBtns = screen.getAllByTitle('Delete Profile');
            expect(deleteBtns).toHaveLength(2);

            fireEvent.click(deleteBtns[0]!);

            expect(mockDeleteProfile).toHaveBeenCalledWith('p1');
        });
    });
});
