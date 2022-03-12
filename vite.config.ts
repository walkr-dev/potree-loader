import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [glsl()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'potree-loader',
      fileName: (format) => `potree-loader.${format}.js`
    }
  },
  resolve: {
    alias: {
      'three': resolve('./node_modules/three')
    }
  }
})