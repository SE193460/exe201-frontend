# Roomie — Frontend

Single-page web app for **Roomie**, a roommate / rental-listing platform. Built with React 19, Vite, TypeScript and Tailwind CSS.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | React 19 + Vite 8 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 |
| Routing | React Router 7 |
| Data fetching | Axios |
| Forms | react-hook-form + Zod |
| i18n | i18next (Vietnamese / English) |
| Icons | lucide-react |
| PDF export | jsPDF + jspdf-autotable (lazy-loaded) |

## Prerequisites

- Node.js 20 or newer
- A running backend (see `../exe201-backend`)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.example .env
# then set VITE_API_BASE_URL=http://localhost:3000

# 3. Start the dev server
npm run dev
```

The app is available at `http://localhost:5173`.

## Environment variables

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the backend API. If omitted, the app falls back to the current origin. |

> Vite only exposes variables prefixed with `VITE_`, and their values are embedded in
> the client bundle — never put secrets here.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check and build for production (`dist/`). |
| `npm run preview` | Preview the production build. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm run lint` | Lint with ESLint. |
| `npm run lint:fix` | Lint and auto-fix. |
| `npm run format` | Format with Prettier. |
| `npm run format:check` | Check formatting without writing. |

## Features

- **Auth** — email/password registration with email verification, Google OAuth, JWT access token + refresh cookie.
- **Listings** — browse + filter (including a "soft filter" based on roommate preferences), detail view with gallery, save/unsave, report, share.
- **Lifestyle profile** — lifestyle questionnaire and roommate preferences.
- **Paid contact views** — buy contact-view credits, confirm MoMo transfer, unlock lifestyle profiles.
- **Listing boost** — promote a listing (QR payment) and confirm the transfer.
- **User dashboard** — profile, my listings, saved listings, payment history (PDF export).
- **Admin dashboard** — users, listings approval, imported listings, amenities, payments, reports, feedback.
- **i18n** — Vietnamese / English toggle.

## Performance & quality notes

- All routes are **lazy-loaded**, so each page is its own chunk.
- Heavy libraries (`jspdf`, `html2canvas`) are **dynamically imported** only when exporting a PDF.
- `strict` TypeScript is enabled; `lint` passes with zero errors.
- User feedback uses an accessible toast system; confirmations use a promise-based dialog instead of `window.confirm`.

## Project structure

```
src/
  api/          # axios instance + typed service modules
  assets/       # static assets
  components/   # shared UI (Navbar, Sidebar, Pagination, Toast, ConfirmDialog, …)
  contexts/     # React contexts (auth, toast, …)
  i18n/         # translations
  layouts/      # page shells (UserShell, admin layouts)
  lib/          # utilities
  pages/        # route components (admin pages under pages/admin)
```
