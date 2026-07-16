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
          // pdf.js — only ever loaded via dynamic import() in the vault; keep it
          // in its own async chunk so it doesn't bloat the eager vendor bundle.
          if (id.includes('node_modules/pdfjs-dist')) return 'pdfjs';
          // Heavy DOC-processing libs (Excel export, Word/PDF scan, invoice PDF) are ONLY
          // reached via dynamic import(). The catch-all `return 'vendor'` below was wrongly
          // pulling them (+ their private deps) into the EAGER vendor chunk — ~2.5MB that
          // every page paid for on first load. Routing them to a dedicated chunk keeps it
          // ASYNC (no eager importer), so it loads only when you export/scan/invoice.
          if (/node_modules\/(xlsx-js-style|xlsx|mammoth|jspdf|html2canvas|jszip|canvg|dingbat-to-unicode|@xmldom|xmldom|xmlbuilder|fast-png|bluebird)\//.test(id)) return 'docs-tools';
          // NOTE: Do NOT hand-split eager libs here: it can reorder chunk init and cause
          // "cannot access X before init" (TDZ). Everything else:
          if (id.includes('node_modules/')) return 'vendor';
        }
      }
    },
    chunkSizeWarningLimit: 600,
    target: 'es2020',
  }
})
