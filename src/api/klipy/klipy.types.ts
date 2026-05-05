export interface KlipyGif {
    klipyId?: string | number;
    id?: string | number;
    url?: string;
    previewUrl?: string;
    width?: number;
    height?: number;
    file?: {
        sm?: { gif?: { url?: string; width?: number; height?: number } };
        xs?: { gif?: { url?: string } };
    };
    contentType?: 'gif' | 'sticker';
}

export interface KlipyFavorite {
    klipyId: string;
    url: string;
    previewUrl: string;
    width: number;
    height: number;
    contentType: 'gif' | 'sticker';
}

export interface KlipyApiResponse<T> {
    data: {
        data: T;
    };
}

export interface KlipySearchResponse {
    data: {
        data: KlipyGif[];
    };
}
