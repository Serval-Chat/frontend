import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';


// https://vite.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/providers': path.resolve(__dirname, './src/providers'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      'decode-named-character-reference': path.resolve(
        __dirname,
        'node_modules/decode-named-character-reference/index.js',
      ),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'ui-libs';
            }
            if (id.includes('redux') || id.includes('@tanstack/react-query')) {
              return 'state-management';
            }
            if (id.includes('react-syntax-highlighter') || id.includes('refractor') || id.includes('highlight.js')) {
              return 'syntax-highlighting';
            }
            if (id.includes('emoji-datasource')) {
              return 'emoji-data';
            }
            return 'common-libs';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
