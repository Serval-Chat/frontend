import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/ui': path.resolve(__dirname, './src/ui'),
            '@/pages': path.resolve(__dirname, './src/pages'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/styles': path.resolve(__dirname, './src/styles'),
            '@/providers': path.resolve(__dirname, './src/providers'),
            '@/utils': path.resolve(__dirname, './src/utils'),
        },
    },
});
