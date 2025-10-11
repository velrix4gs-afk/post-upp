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
          // React core libraries - MUST load first
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }
          // Lucide icons - depends on React, so separate chunk
          if (id.includes('node_modules/lucide-react')) {
            return 'react-icons';
          }
          // React Router - depends on React
          if (id.includes('node_modules/react-router-dom')) {
            return 'react-router';
          }
          // Radix UI components - depends on React
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          // Other large dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
}));
