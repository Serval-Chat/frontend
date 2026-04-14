import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { adminNotesApi } from '@/api/admin/notes.api';
import type { AdminNote } from '@/types/admin';

export const useAdminNotes = (
    targetId: string,
    targetType: 'Server' | 'User',
): UseQueryResult<AdminNote[], Error> =>
    useQuery<AdminNote[]>({
        queryKey: ['admin-notes', targetType, targetId],
        queryFn: () =>
            targetType === 'Server'
                ? adminNotesApi.getServerNotes(targetId)
                : adminNotesApi.getUserNotes(targetId),
        enabled: !!targetId,
    });

export const useCreateAdminNote = (): UseMutationResult<
    AdminNote,
    Error,
    { targetId: string; targetType: 'Server' | 'User'; content: string }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            targetId,
            targetType,
            content,
        }: {
            targetId: string;
            targetType: 'Server' | 'User';
            content: string;
        }) => adminNotesApi.createNote(targetId, targetType, content),
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: [
                    'admin-notes',
                    variables.targetType,
                    variables.targetId,
                ],
            });
        },
    });
};

export const useUpdateAdminNote = (): UseMutationResult<
    AdminNote,
    Error,
    { noteId: string; content: string }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            noteId,
            content,
        }: {
            noteId: string;
            content: string;
        }) => adminNotesApi.updateNote(noteId, content),
        onSuccess: (updatedNote) => {
            void queryClient.invalidateQueries({
                queryKey: [
                    'admin-notes',
                    updatedNote.targetType,
                    updatedNote.targetId,
                ],
            });
        },
    });
};

export const useDeleteAdminNote = (): UseMutationResult<
    AdminNote,
    Error,
    { noteId: string; reason: string }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ noteId, reason }: { noteId: string; reason: string }) =>
            adminNotesApi.deleteNote(noteId, reason),
        onSuccess: (deletedNote) => {
            void queryClient.invalidateQueries({
                queryKey: [
                    'admin-notes',
                    deletedNote.targetType,
                    deletedNote.targetId,
                ],
            });
        },
    });
};
