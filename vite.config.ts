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
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['three'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          three: 'THREE'
        }
      }
    }
  }
})