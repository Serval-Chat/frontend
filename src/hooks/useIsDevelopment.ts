export const useIsDevelopment = (): boolean =>
    import.meta.env.VITE_PROJ_LEVEL === 'development';
