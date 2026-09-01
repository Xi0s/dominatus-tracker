# Dominatus Campaign Tracker

Dominatus Campaign Tracker is a browser-based ledger for running War Zone Armageddon campaigns. Use it to manage campaign phases and locations, roster commanders, record battles and scores, track agendas and upgrades, and maintain the campaign narrative.

The app is fully local. It has no backend, authentication, Firebase configuration, or remote campaign storage.

## Requirements

- Node.js 20 or later
- npm

## Develop

Install the project dependencies once:

```sh
npm install
```

Start the Vite development server:

```sh
npm run dev
```

Open the local URL printed by Vite. The app is served under `/dominatus-tracker/` to match its configured deployment base path.

## Build

Create an optimized production build:

```sh
npm run build
```

The generated static site is written to `dist/`. Preview that build locally with:

```sh
npm run preview
```

## Test And Lint

Run the end-to-end Playwright suite:

```sh
npm run test:e2e
```

The suite starts a local development server when needed and covers startup, autosaving, commander management, battle recording, and JSON import/export.

Run the source linter with:

```sh
npm run lint
```

If Playwright's Chromium runtime has not been installed on a machine yet, run:

```sh
npx playwright install chromium
```

## Campaign Data

Campaign data is stored in the current browser profile's `localStorage` under the versioned key `dominatus-campaign-tracker.v1`. Each browser profile and device has its own separate campaign copy.

Use **Export JSON** to download a portable campaign file and **Import JSON** to restore one. Export campaign data regularly: clearing browser site data or choosing **Reset local data** permanently removes the local copy.

## Project Layout

```text
src/
	components/  Shared UI building blocks
	data/        Static campaign rules and card data
	features/    Campaign, roster, and battle-log views
	lib/         Campaign helpers and local persistence
	App.jsx      Application state and feature composition
tests/         Playwright end-to-end tests
```

Static campaign data is kept separate from UI and persistence code to make rules-content updates easier to review.
