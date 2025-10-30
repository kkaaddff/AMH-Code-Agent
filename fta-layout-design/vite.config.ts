import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'context': path.resolve(__dirname, './src/context'),
      'utils': path.resolve(__dirname, './src/utils'),
      'config': path.resolve(__dirname, './src/config'),
      'app': path.resolve(__dirname, './src/app'),
      'components': path.resolve(__dirname, './src/components'),
      'types': path.resolve(__dirname, './src/types'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'workflow': path.resolve(__dirname, './src/workflow'),
    }
  }
})