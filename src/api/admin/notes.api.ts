import { apiClient } from '@/api/client';
import type { AdminNote } from '@/types/admin';

export const adminNotesApi = {
    getServerNotes: (serverId: string) =>
        apiClient
            .get<AdminNote[]>(`/api/v1/admin/servers/${serverId}/notes`)
            .then((r) => r.data),

    getUserNotes: (userId: string) =>
        apiClient
            .get<AdminNote[]>(`/api/v1/admin/users/${userId}/notes`)
            .then((r) => r.data),

    createNote: (
        targetId: string,
        targetType: 'Server' | 'User',
        content: string,
    ) =>
        apiClient
            .post<AdminNote>(
                `/api/v1/admin/${targetType === 'Server' ? 'servers' : 'users'}/${targetId}/notes`,
                { content },
            )
            .then((r) => r.data),

    updateNote: (noteId: string, content: string) =>
        apiClient
            .put<AdminNote>(`/api/v1/admin/notes/${noteId}`, { content })
            .then((r) => r.data),

    deleteNote: (noteId: string, reason: string) =>
        apiClient
            .delete<AdminNote>(`/api/v1/admin/notes/${noteId}`, {
                data: { reason },
            })
            .then((r) => r.data),
};
