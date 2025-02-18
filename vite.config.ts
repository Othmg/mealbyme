import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
        },
      },
    },
  },
  define: {
    // Replace process.env with empty strings for sensitive variables
    'process.env.VITE_OPENAI_API_KEY': '""',
    'process.env.VITE_SUPABASE_ANON_KEY': '""',
  },
});