import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/layouts': path.resolve(__dirname, './src/layouts'),
            '@/modules': path.resolve(__dirname, './src/modules'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/contexts': path.resolve(__dirname, './src/contexts'),
            '@/services': path.resolve(__dirname, './src/services'),
            '@/api': path.resolve(__dirname, './src/api'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/styles': path.resolve(__dirname, './src/styles'),
            '@/types': path.resolve(__dirname, './src/types'),
            '@/config': path.resolve(__dirname, './src/config'),
            '@/assets': path.resolve(__dirname, './src/assets'),
        },
    },
    server: {
        port: 5173,
        open: false,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-query': ['@tanstack/react-query'],
                    'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
                    'vendor-charts': ['recharts'],
                },
            },
        },
    },
});
