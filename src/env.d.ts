/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module 'react-syntax-highlighter/dist/esm/prism';
declare module 'react-syntax-highlighter/dist/esm/styles/prism';
