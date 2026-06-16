# DevFlow

> One dashboard for all your CI/CD pipelines. GitHub Actions + GitLab CI, unified.

<!-- Screenshot placeholder -->

![MIT License](https://img.shields.io/badge/license-MIT-22c55e)
![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Open Issues](https://img.shields.io/github/issues/saimk/devflow)

## Features

### Pipelines

- ✅ Real-time DAG visualization for pipeline jobs and dependencies.
- ✅ Log streaming with terminal-style output and large-log virtualization.
- ✅ Status, branch, and search filtering with URL-backed state.
- ✅ Deep links to pipeline details and selected jobs.

### Workflows

- ✅ Trigger manual workflow runs from the dashboard.
- ✅ Enable and disable workflow actions from the UI.
- ✅ Track success rate, average duration, total runs, and last run state.

### Runners

- ✅ Utilization charts for recent runner activity.
- ✅ Live job tracking for busy runners.
- ✅ Filter runners by status, type, OS, and labels.

### Settings

- ✅ Connect GitHub Actions and GitLab CI providers.
- ✅ Manage pinned repositories and active data sources.
- ✅ Customize appearance, density, and timestamp formatting.
- ✅ View and use global keyboard shortcuts.

### General

- ✅ Works with demo data out of the box.
- ✅ No account required to try the app.
- ✅ Provider tokens stay in your browser.

## Screenshots

### Pipeline DAG

<!-- Add Pipeline DAG screenshot here -->

### Runners Page

<!-- Add Runners page screenshot here -->

### Workflow Trigger

<!-- Add Workflow trigger screenshot here -->

### Settings

<!-- Add Settings screenshot here -->

## Getting Started

### Use without installing

> DevFlow runs entirely in the browser. Visit [devflow.app](https://devflow.app).

### Run locally

```bash
git clone https://github.com/saimk/devflow
cd devflow
npm install
npm run dev
```

### Self-hosting

```bash
npm run build
# Serve the dist/ folder with any static file host
# (Vercel, Netlify, GitHub Pages, nginx)
```

## Connecting Your Providers

### GitHub Actions

1. Go to Settings -> Providers.
2. Click "Connect GitHub".
3. Generate a token with `repo` and `workflow` scopes.
4. Paste the token and connect.

### GitLab CI

1. Go to Settings -> Providers.
2. Click "Connect GitLab".
3. Choose GitLab.com or enter your self-hosted GitLab URL.
4. Generate a token with `read_api`, `read_user`, and `read_repository` scopes.
5. Paste the token and connect.

## Privacy & Security

> DevFlow makes API calls directly from your browser to GitHub and GitLab. Your tokens are stored only in your browser's localStorage. No server, no accounts, no telemetry.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `G` then `P` | Go to Pipelines |
| `G` then `W` | Go to Workflows |
| `G` then `R` | Go to Runners |
| `G` then `S` | Go to Settings |
| `/` | Focus search |
| `Escape` | Close panel or modal |
| `R` | Refresh current data |
| `?` | Show keyboard shortcuts |

## Tech Stack

| Library | Purpose |
| --- | --- |
| React 18 | UI rendering |
| TypeScript | Static typing |
| Vite | Development server and production build |
| Tailwind CSS | Utility-first styling and design tokens |
| Radix UI | Accessible UI primitives |
| React Flow | Pipeline DAG canvas |
| XState | Pipeline lifecycle modeling |
| TanStack Query | API caching, polling, and invalidation |
| nuqs | URL search param state |
| Zustand | Persistent provider and repository state |
| Framer Motion | Page, modal, and panel motion |
| Recharts | Runner utilization charts |
| Sonner | Toast notifications |
| Lucide React | Icons |
| date-fns | Date and relative time formatting |

## Contributing

> PRs welcome. Please open an issue first for large changes.

## License

MIT © 2026 — Built by Saim
