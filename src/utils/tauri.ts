/**
 * Returns true when running inside a Tauri app (desktop and mobile)
 */
export const isTauri = (): boolean =>
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
