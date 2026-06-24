import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Use the repo-name sub-path on GitHub Pages; relative path for local dev.
  base: process.env.GITHUB_ACTIONS ? '/book-read/' : './',
  plugins: [react()],
})
