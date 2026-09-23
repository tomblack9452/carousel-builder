import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single-file build: dist/index.html opens straight from disk, like the original tool.
export default defineConfig({
  plugins: [vue(), viteSingleFile()],
})
