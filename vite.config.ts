import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
    target: 'esnext',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  define: {
    // Replace process.env with empty object to prevent environment variables from being bundled
    'process.env': '{}',
    // Explicitly define only the public environment variables
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    // Remove sensitive keys from the client bundle
    'import.meta.env.VITE_STRIPE_SECRET_KEY': '""',
    'import.meta.env.VITE_OPENAI_API_KEY': '""'
  }
});