import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project sites live at https://<user>.github.io/<repo>/
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base =
  process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
