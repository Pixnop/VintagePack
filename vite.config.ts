import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/VintagePack/', // GitHub Pages base path
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          utils: ['clsx', 'fuse.js', 'zustand'],
          // Heavy visualization libraries
          visualization: ['react-flow-renderer', 'd3'],
        },
      },
    },
    // Performance optimizations
    sourcemap: false, // Disable for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true,
    proxy: {
      '/api/vsmoddb': {
        target: 'https://mods.vintagestory.at',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vsmoddb/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  
  // Preview server for testing builds
  preview: {
    port: 4173,
    host: true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      'clsx',
      'fuse.js'
    ],
  },
  
  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  
  // CSS processing
  css: {
    postcss: './postcss.config.js',
  },
})