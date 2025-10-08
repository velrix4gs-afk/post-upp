import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssCodeSplit: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          // Supabase - split into separate chunk to avoid loading on non-authenticated pages
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }
          // Toast libraries - split to avoid loading both initially
          if (id.includes('node_modules/sonner') || id.includes('node_modules/@radix-ui/react-toast')) {
            return 'toast-vendor';
          }
          // Heavy UI components - only load when needed
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-vendor';
          }
          // Form and validation libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform')) {
            return 'forms-vendor';
          }
        },
      },
    },
  },
}));
