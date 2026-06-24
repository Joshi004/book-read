import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// HashRouter is used in the app, so no SPA-rewrite config is needed for static hosting.
// For GitHub Pages, set `base` to '/<repo-name>/' before building.
export default defineConfig({
  base: './',
  plugins: [react()],
})
