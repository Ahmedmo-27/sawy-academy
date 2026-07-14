# AGENTS.md

## Cursor Cloud specific instructions

### Product overview
`sawy-academy` is a single Next.js 15 (App Router) / React 19 / TypeScript / Tailwind CSS v4 marketing + portfolio website ("Sawy Academy"). It is **one service** with **no database, no external backend, and no required environment variables**. All domain content (courses, portfolio, products, researches) is static TypeScript data under `lib/data/`.

### Service (single)
- Dev server: `npm run dev` (Next.js on `http://localhost:3000`).
- Commands are defined in `package.json`: `dev`, `build`, `start`, `lint`.
- The only server-side logic is the `POST /api/contact` route, which currently just validates input and `console.info`-logs the inquiry (no email/CRM wired up), so the contact form works fully offline with no config.

### Non-obvious notes
- `npm run lint` uses `next lint`, which prints a deprecation warning ("deprecated and will be removed in Next.js 16") but still exits 0 — the warning is expected, not a failure.
- Type-checking happens during `npm run build` (`tsconfig.json` has `noEmit: true`); there is no separate typecheck script.
- There is **no test framework or test script** in this repo — do not expect `npm test` to exist.
