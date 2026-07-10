import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase (all sub-packages like @firebase/*)
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
          // Framer Motion
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) return 'framer';
          // React core
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router') || id.includes('node_modules/scheduler')) return 'react';
          // Icons
          if (id.includes('node_modules/lucide-react')) return 'icons';
          // Heavy / admin-only libs — split into their OWN chunks so they are NOT fused
          // into the eager `vendor` chunk (they load on demand: xlsx ~900KB is the big one).
          if (id.includes('node_modules/xlsx')) return 'xlsx';
          if (id.includes('node_modules/mammoth')) return 'mammoth';
          if (id.includes('node_modules/@stripe')) return 'stripe';
          if (id.includes('node_modules/canvas-confetti')) return 'confetti';
          if (id.includes('node_modules/@tanstack')) return 'tanstack';
          if (id.includes('node_modules/@vercel')) return 'vercel';
          // Everything else
          if (id.includes('node_modules/')) return 'vendor';
        }
      }
    },
    chunkSizeWarningLimit: 600,
    target: 'es2020',
  }
})
