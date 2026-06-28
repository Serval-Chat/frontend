import { apiClient } from '@/api/client';

export interface Decoration {
    id: string;
    name: string;
    filename: string;
    createdBy: string;
    createdAt: string;
}

export const getDecorationUrl = (
    id: string,
    baseSize: number = 128,
): string => {
    const pixelRatio =
        typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const finalSize = Math.round(baseSize * 1.25 * pixelRatio);
    return `/api/v1/decorations/file/${id}?size=${finalSize}`;
};

export const decorationsApi = {
    upload: (
        name: string,
        file: File,
    ): Promise<{ message: string; decoration: Decoration }> => {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('file', file);
        return apiClient
            .post<{
                message: string;
                decoration: Decoration;
            }>('/api/v1/decorations/upload', formData)
            .then((r) => r.data);
    },

    apply: (id: string): Promise<{ message: string }> =>
        apiClient
            .post<{ message: string }>(`/api/v1/decorations/${id}/apply`)
            .then((r) => r.data),

    removeActive: (): Promise<{ message: string }> =>
        apiClient
            .delete<{ message: string }>('/api/v1/decorations/active')
            .then((r) => r.data),

    get: (id: string): Promise<Decoration> =>
        apiClient
            .get<Decoration>(`/api/v1/decorations/${id}`)
            .then((r) => r.data),

    getMyDecorations: (): Promise<{ decorations: Decoration[] }> =>
        apiClient
            .get<{ decorations: Decoration[] }>('/api/v1/decorations/my')
            .then((r) => r.data),

    deleteDecoration: (id: string): Promise<{ message: string }> =>
        apiClient
            .delete<{ message: string }>(`/api/v1/decorations/${id}`)
            .then((r) => r.data),
};
