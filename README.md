# EU Gas Inventory

Static dashboard for European gas inventory data, designed for GitHub Pages and GitHub Actions based refreshes.

## What it does

- Pulls GIE AGSI storage data with a GitHub-hosted secret
- Builds static JSON files for EU aggregate and country-level history
- Publishes a one-page dashboard to GitHub Pages

## Repository secret

Add this secret in GitHub:

- `GIE_API_KEY`: your AGSI API key

The key is used only in GitHub Actions and is never exposed in frontend code.

## Local commands

```bash
npm test
npm run build:data:sample
GIE_API_KEY=your_key npm run build:data
```

## Data files

Generated files live in `data/`:

- `meta.json`
- `countries.json`
- `latest.json`
- `history.json`

## GitHub Actions

- `update-data.yml`: scheduled or manual data refresh
- `deploy-pages.yml`: deploys the static dashboard to GitHub Pages

## GitHub Pages

The deployment workflow publishes a static artifact that contains:

- `src/index.html`
- `src/styles.css`
- `src/app.js`
- `data/*.json`

No backend is required.
