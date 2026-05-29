import { apiClient } from '@/api/client';
import type { AdminNote } from '@/types/admin';

export const adminNotesApi = {
    getServerNotes: (serverId: string): Promise<AdminNote[]> =>
        apiClient
            .get<AdminNote[]>(`/api/v1/admin/servers/${serverId}/notes`)
            .then((r): AdminNote[] => r.data),

    getUserNotes: (userId: string): Promise<AdminNote[]> =>
        apiClient
            .get<AdminNote[]>(`/api/v1/admin/users/${userId}/notes`)
            .then((r): AdminNote[] => r.data),

    createNote: (
        targetId: string,
        targetType: 'Server' | 'User',
        content: string,
    ): Promise<AdminNote> =>
        apiClient
            .post<AdminNote>(
                `/api/v1/admin/${targetType === 'Server' ? 'servers' : 'users'}/${targetId}/notes`,
                { content },
            )
            .then((r): AdminNote => r.data),

    updateNote: (noteId: string, content: string): Promise<AdminNote> =>
        apiClient
            .put<AdminNote>(`/api/v1/admin/notes/${noteId}`, { content })
            .then((r): AdminNote => r.data),

    deleteNote: (noteId: string, reason: string): Promise<AdminNote> =>
        apiClient
            .delete<AdminNote>(`/api/v1/admin/notes/${noteId}`, {
                data: { reason },
            })
            .then((r): AdminNote => r.data),
};
