import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';


// https://vite.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

  return {
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (p) => p,
      },
    },
  },
    optimizeDeps: {
      include: ['mermaid'],
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
            if (id.includes('langium')) {
              return 'langium';
            }
            if (id.includes('cytoscape')) {
              return 'cytoscape';
            }
            if (id.includes('livekit-client')) {
              return 'livekit-client';
            }
            if (id.includes('mermaid')) {
              return 'mermaid';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('chevrotain')) {
              return 'chevrotain';
            }
            if (id.includes('vscode-jsonrpc')) {
              return 'vscode-jsonrpc';
            }
            if (id.includes('vscode-languageserver-protocol')) {
              return 'vscode-languageserver-protocol';
            }
            if (id.includes('dompurify')) {
              return 'dompurify';
            }
            if (id.includes('@tanstack')) {
              return 'tanstack';
            }
            if (id.includes('katex')) {
              return 'katex';
            }
            if (id.includes('lexical')) {
              return 'lexical';
            }
            if (id.includes('layout-base')) {
              return 'layout-base';
            }
            if (id.includes('dagre-d3-es')) {
              return 'dagre-d3-es';
            }
            return 'common-libs';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  };
});
