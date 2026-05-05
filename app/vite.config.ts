import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    mode === 'development' ? inspectAttr() : null,
    react(),
  ],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor';
          if (id.includes('lucide-react') || id.includes('react-icons') || id.includes('@react-icons')) return 'icons-vendor';
          if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul')) return 'ui-vendor';
          if (id.includes('dompurify')) return 'sanitize-vendor';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
