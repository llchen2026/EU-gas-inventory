# Europe Gas Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone GitHub Pages dashboard for EU gas inventory data with scheduled AGSI ingestion, frontend visualizations, and repository automation.

**Architecture:** Use Node.js build scripts to fetch and normalize AGSI API responses into static JSON files committed to the repo. Serve a static frontend from GitHub Pages that reads only generated JSON and renders overview cards, a comparison chart, and a sortable country table.

**Tech Stack:** Node.js, native web components with plain HTML/CSS/JavaScript, GitHub Actions, GitHub Pages, Node test runner

---

### Task 1: Initialize repository structure

**Files:**
- Create: `package.json`
- Create: `src/index.html`
- Create: `src/styles.css`
- Create: `src/app.js`
- Create: `scripts/shared/countries.mjs`
- Create: `data/.gitkeep`

- [ ] Write the project scaffold and dependency-free baseline.
- [ ] Verify `npm test` is wired, even before data logic exists.

### Task 2: Add AGSI normalization tests and implementation

**Files:**
- Create: `scripts/shared/normalize.mjs`
- Create: `scripts/shared/agsi-client.mjs`
- Create: `scripts/build-data.mjs`
- Create: `tests/normalize.test.mjs`

- [ ] Write failing tests for AGSI row normalization and derived daily change behavior.
- [ ] Implement minimal normalization helpers and builders to satisfy the tests.
- [ ] Verify tests pass.

### Task 3: Add sample data contract and frontend rendering

**Files:**
- Create: `data/latest.json`
- Create: `data/history.json`
- Create: `data/countries.json`
- Create: `data/meta.json`
- Modify: `src/index.html`
- Modify: `src/styles.css`
- Modify: `src/app.js`

- [ ] Add stable sample data so the static page can render locally.
- [ ] Render overview cards, chart, and table from the JSON contract.
- [ ] Verify the page loads without bundling.

### Task 4: Add GitHub Actions automation

**Files:**
- Create: `.github/workflows/update-data.yml`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`

- [ ] Add scheduled data update workflow using `GIE_API_KEY` from GitHub Secrets.
- [ ] Add Pages deployment workflow.
- [ ] Document setup and manual run steps in the README.

### Task 5: Verify implementation

**Files:**
- Modify: `package.json`

- [ ] Run tests.
- [ ] Run the build-data script against sample mode.
- [ ] Summarize any steps that still require GitHub-side setup.
