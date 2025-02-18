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
    // Prevent environment variables from being bundled in the client
    'process.env': '{}',
    // Only expose the URL in the client bundle as it's required for initialization
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    // Replace sensitive values with empty strings in production bundle
    'import.meta.env.VITE_SUPABASE_ANON_KEY': '""',
    'import.meta.env.VITE_STRIPE_SECRET_KEY': '""',
    'import.meta.env.VITE_OPENAI_API_KEY': '""',
    'import.meta.env.MODE': JSON.stringify(process.env.MODE),
    'import.meta.env.PROD': process.env.PROD,
    'import.meta.env.DEV': process.env.DEV,
  }
});