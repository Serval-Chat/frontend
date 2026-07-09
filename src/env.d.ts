/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_ALTERNATIVE_URLS: string;
    readonly VITE_LIVEKIT_URL: string;
    readonly VITE_MAX_MESSAGE_LENGTH: number;
    readonly VITE_ALTERNATIVE_URLS: string[];
    readonly VITE_ENABLE_SENTRY: string;
    readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
