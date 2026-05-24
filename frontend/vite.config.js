import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ReactCompilerConfig from './react-compiler.config.js' // if you have one

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', ReactCompilerConfig]
        ]
      }
    })
  ],
})