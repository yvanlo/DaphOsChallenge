
# DaphOS — Staff Scheduler

A small React + Vite app for managing staff and weekly shift schedules. The UI is intentionally minimal so you can run it locally, inspect the schedule logic, and extend it for your needs.

This README explains how to set up the project, run it in development, build for production, and run basic checks (lint).

---

## Prerequisites

- Node.js (LTS) installed — Node 16+ is sufficient. Use nvm if you need to switch versions:

```bash
# example using nvm
nvm install --lts
nvm use --lts
```

- npm (bundled with Node) — work from a terminal using your default shell (zsh on macOS in this repo).

## Install

Clone the repository (if not already) and install dependencies:

```bash
git clone <repo-url>
cd daphos-challenge
npm install
```

Replace `<repo-url>` with your repository URL if you cloned from elsewhere.

## Available scripts

The project uses Vite. The most common commands are provided in `package.json`:

- `npm run dev` — start the development server (hot reload)
- `npm run build` — build a production bundle into `dist/`
- `npm run preview` — locally serve the production build (after `npm run build`)
- `npm run lint` — run ESLint across the source files

Example usage:

```bash
# start dev server
npm run dev

# build for production
npm run build

# preview the production build
npm run preview

# run linter
npm run lint
```

When the dev server runs, Vite will print the local URL (usually http://localhost:5173) where you can open the app.

## Project layout (short)

- `index.html` — app root
- `src/` — source code
	- `main.jsx`, `App.jsx` — app entry and top-level layout
	- `components/` — React components (EmployeeForm, EmployeeList, ScheduleCalendar, ScheduleForm)
	- `hooks/` — small local hooks for state management (`useEmployeeStore.js`, `useScheduleStore.js`)
	- `styles/` — CSS files
- `public/` — static assets

The code stores data locally in `localStorage` for both employees and shifts — there is no backend required to run the app locally.

## Notes about the code

- The schedule logic lives in `src/hooks/useScheduleStore.js`. It implements a small business rule: when an `ON_CALL` shift is added, the next day's `DAY_SHIFT` (if any) is converted into a `POST_CALL_REST` (or one is created if none exists). Deleting an `ON_CALL` will revert that `POST_CALL_REST` back to a default `DAY_SHIFT` where applicable.

- Visible UI text and internal comments have been converted to concise English to make the code easier to read and maintain.

## Linting

This project includes a basic ESLint setup. Run:

```bash
npm run lint
```

Fixes may be manual. If you'd like, I can run ESLint and apply automatic fixes where safe.

## Build & Deployment

For a simple static deployment (Netlify, Vercel, GitHub Pages with an adapter, etc.), run:

```bash
npm run build
```

Then upload the contents of the `dist/` directory to your static host. If you want a server preview locally, use:

```bash
npm run preview
```

## Development tips

- The app persists data in `localStorage`. To reset sample data while developing, clear the site data from your browser or open the devtools and remove the keys used by the app.

- The UI is intentionally small and easy to modify. If you add new features that change the data shape (for example, additional shift properties), consider adding tests for `useScheduleStore` to protect the business rules.

