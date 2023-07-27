import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts(), glsl()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'potree-loader',
      fileName: 'potree-loader'
    },
  },
  resolve: {
    alias: {
      'three': resolve('./node_modules/three')
    }
  }
})