interface TauriHttp {
    fetch: (
        url: string,
        options?: {
            method?: string;
            headers?: Record<string, string>;
            body?: unknown;
            responseType?: number;
        },
    ) => Promise<{
        ok: boolean;
        status: number;
        data: unknown;
    }>;
}

interface TauriFs {
    writeBinaryFile: (
        path: string,
        contents: Uint8Array,
        options?: {
            baseDir?: number;
        },
    ) => Promise<void>;
    BaseDirectory: {
        Download: number;
        [key: string]: number;
    };
}

interface Window {
    __TAURI__?: {
        http: TauriHttp;
        fs: TauriFs;
    };
}
