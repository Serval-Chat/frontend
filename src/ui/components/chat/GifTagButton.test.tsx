import type React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as gifTagsQueries from '@/api/gifTags/gifTags.queries';

import { GifTagButton } from './GifTagButton';

vi.mock('@/ui/components/common/Popover', () => ({
    Popover: ({
        isOpen,
        children,
    }: {
        isOpen: boolean;
        children: React.ReactNode;
    }) => (isOpen ? <div>{children}</div> : null),
}));

vi.mock('@/api/gifTags/gifTags.queries');

const showToast = vi.fn();
vi.mock('@/ui/components/common/Toast', () => ({
    useToast: () => ({ showToast }),
}));

describe('GifTagButton', (): void => {
    const mockCreateTag = vi.fn();
    const mockDeleteTag = vi.fn();
    const mockAddTags = vi.fn();
    const mockRemoveTags = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();

        vi.mocked(gifTagsQueries.useGifTags).mockReturnValue({
            data: [
                { id: 'tag-1', name: 'funny' },
                { id: 'tag-2', name: 'cats' },
            ],
        } as any);
        vi.mocked(gifTagsQueries.useCreateGifTag).mockReturnValue({
            mutate: mockCreateTag,
        } as any);
        vi.mocked(gifTagsQueries.useDeleteGifTag).mockReturnValue({
            mutate: mockDeleteTag,
        } as any);
        vi.mocked(gifTagsQueries.useAddTagsToGif).mockReturnValue({
            mutate: mockAddTags,
        } as any);
        vi.mocked(gifTagsQueries.useRemoveTagsFromGif).mockReturnValue({
            mutate: mockRemoveTags,
        } as any);
        vi.mocked(gifTagsQueries.getApiErrorMessage).mockImplementation(
            (_error: unknown, fallback: string) => fallback,
        );
    });

    it('opens the tag popover and lists the tags with checked state', (): void => {
        render(
            <GifTagButton appliedTagIds={['tag-1']} klipyId="klipy1" />,
        );

        fireEvent.click(screen.getByLabelText('Manage tags'));

        expect(screen.getByText('funny')).toBeTruthy();
        expect(screen.getByText('cats')).toBeTruthy();
    });

    it('adds an unapplied tag when clicked', (): void => {
        render(
            <GifTagButton appliedTagIds={[]} klipyId="klipy1" />,
        );

        fireEvent.click(screen.getByLabelText('Manage tags'));
        fireEvent.click(screen.getByText('funny'));

        expect(mockAddTags).toHaveBeenCalledWith({
            klipyId: 'klipy1',
            tagIds: ['tag-1'],
        });
        expect(mockRemoveTags).not.toHaveBeenCalled();
    });

    it('removes an applied tag when clicked', (): void => {
        render(
            <GifTagButton appliedTagIds={['tag-1']} klipyId="klipy1" />,
        );

        fireEvent.click(screen.getByLabelText('Manage tags'));
        fireEvent.click(screen.getByText('funny'));

        expect(mockRemoveTags).toHaveBeenCalledWith({
            klipyId: 'klipy1',
            tagIds: ['tag-1'],
        });
        expect(mockAddTags).not.toHaveBeenCalled();
    });

    it('creates a new tag and applies it to the GIF', (): void => {
        mockCreateTag.mockImplementation(
            (
                _name: string,
                opts?: { onSuccess?: (tag: { id: string }) => void },
            ) => {
                opts?.onSuccess?.({ id: 'new-tag-id' });
            },
        );

        render(
            <GifTagButton appliedTagIds={[]} klipyId="klipy1" />,
        );

        fireEvent.click(screen.getByLabelText('Manage tags'));
        fireEvent.change(screen.getByPlaceholderText('New tag...'), {
            target: { value: 'silly' },
        });
        fireEvent.submit(screen.getByPlaceholderText('New tag...'));

        expect(mockCreateTag).toHaveBeenCalledWith(
            'silly',
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
        expect(mockAddTags).toHaveBeenCalledWith({
            klipyId: 'klipy1',
            tagIds: ['new-tag-id'],
        });
    });

    it('deletes a tag without toggling its applied state', (): void => {
        render(
            <GifTagButton appliedTagIds={['tag-1']} klipyId="klipy1" />,
        );

        fireEvent.click(screen.getByLabelText('Manage tags'));
        fireEvent.click(screen.getByLabelText('Delete tag funny'));

        expect(mockDeleteTag).toHaveBeenCalledWith(
            'tag-1',
            expect.objectContaining({ onError: expect.any(Function) }),
        );
        expect(mockAddTags).not.toHaveBeenCalled();
        expect(mockRemoveTags).not.toHaveBeenCalled();
    });

    it('shows an empty state when the user has no tags', (): void => {
        vi.mocked(gifTagsQueries.useGifTags).mockReturnValue({
            data: [],
        } as any);

        render(
            <GifTagButton appliedTagIds={[]} klipyId="klipy1" />,
        );

        fireEvent.click(screen.getByLabelText('Manage tags'));

        expect(screen.getByText('No tags yet')).toBeTruthy();
    });
});
