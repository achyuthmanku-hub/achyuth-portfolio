# Achyuth Reddy Manku — Portfolio

Professional software engineer portfolio built with Vite + React.

**Live site:** after GitHub Pages is enabled, your site will be at  
`https://achyuthmanku-hub.github.io/achyuth-portfolio/`

## Local development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. In your repo on GitHub, go to **Settings → Pages** and set source to **GitHub Actions**.
2. Add the workflow file via the GitHub web UI (avoids PAT `workflow` scope issues):
   - Click **Add file → Create new file**
   - Path: `.github/workflows/deploy.yml`
   - Paste contents from [`deploy-workflow.yml.example`](./deploy-workflow.yml.example)
   - Commit directly to `main`
3. Push any change to `main`, or run the workflow manually under **Actions**.

## Build

```bash
npm run build   # output in dist/
npm run preview # preview production build
```
