export default {
  root: './',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['three/examples/jsm/loaders/GLTFLoader.js']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    include: ['three']
  },
  resolve: {
    alias: {
      '@': 'src',
      'game': 'src/js/game',
      'utils': 'src/js/utils'
    }
  }
} 