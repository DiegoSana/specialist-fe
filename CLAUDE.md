# Specialist Frontend (specialist-fe)

Next.js 16 (App Router) + React 19 + TypeScript public web app for the Specialist marketplace
(clients requesting services, Professionals/Companies fulfilling them) in Bariloche. Talks to the
`specialist-be` NestJS API. Sibling repos live in `/var/www/specialist/`: `specialist-be` (backend,
has the canonical domain model), `specialist-admin` (admin portal), `specialist-shared` (shared
TS package — not currently consumed by this repo, see Gotchas).

Runs on port **3001** in dev (backend runs on 5000). Detailed, path-scoped rules live in
`.claude/rules/`.

## Commands

```bash
npm run dev                  # next dev -p 3001, http://localhost:3001
npm run build                # next build
npm run lint                 # eslint . (flat config: eslint.config.mjs, eslint-config-next)
npm run format                # prettier --write "**/*.{ts,tsx,json,css,md}"
npm test                     # jest (jsdom)
npm test -- hooks/__tests__/use-requests.test.tsx   # single spec
npm run test:watch
npm run test:coverage
docker-compose -f docker-compose.dev.yml up -d       # containerized dev server
```

Definition of done for any code change: `npm test` green, `npm run lint` clean, `npm run build`
passes. There is no e2e suite in this repo (unlike `specialist-be`).

## Architecture in one screen

```
app/[locale]/         Next.js App Router pages, one [locale] segment (es default, en) via next-intl.
                       Route groups per role: client/, specialist/, company/, plus auth/, login/,
                       register/, profile/, profile-setup/, notifications/, dashboard/.
components/           Presentational + feature components, one folder per feature area
                       (navigation/, requests/, notifications/, verification/, layout/, cta/,
                       images/, videos/). 'use client' where interactive.
hooks/                One file per resource, TanStack Query wrappers around apiClient
                       (use-requests.ts, use-professionals.ts, use-auth.ts, ...). __tests__/ inline.
lib/                  api-client.ts (axios instance + interceptors), auth.ts (localStorage token/
                       user), verification.ts.
types/index.ts        Frontend DTOs/enums, manually kept in sync with backend DTOs (see Gotchas).
messages/{es,en}.json next-intl translation catalogs, es is the default and source of truth.
i18n.ts               next-intl request config; locales = ['es', 'en'].
```

No client-side global state manager beyond TanStack Query's cache + `localStorage` for the auth
token/user; there is no Redux/Zustand/Context store for domain data.

## Conventions

- Data fetching: one hook per resource in `hooks/`, built on `useApiQuery` (thin wrapper over
  `useQuery` + `apiClient`) or raw `useQuery`/`useMutation` from `@tanstack/react-query`. Query
  keys are arrays, e.g. `['requests', 'client']`, `['request', id]`. Don't call `apiClient`
  directly from components — add or extend a hook.
  Mutations that change server state call `queryClient.invalidateQueries` on the related keys in
  `onSuccess`.
  Components/pages are Server Components by default; add `'use client'` only when a file uses
  hooks, event handlers, or browser APIs.
- Auth: token + user are stored in `localStorage` via `lib/auth.ts` (`setAuthToken`/`getAuthToken`/
  `setUser`/`getUser`/`isAuthenticated`). `apiClient` (`lib/api-client.ts`) attaches
  `Authorization: Bearer <token>` on every request and, on a 401 from a non-auth endpoint, clears
  storage and hard-redirects to `/${locale}/login`. There is no refresh-token flow.
- Role/profile gating in the UI reads `User.hasClientProfile` / `hasProfessionalProfile` /
  `hasCompanyProfile` / `isAdmin` (booleans on the stored user, not a single `role` enum) — mirror
  the backend's "a user can hold multiple profiles" model. `ProtectedLayout`
  (`components/layout/protected-layout.tsx`) is the standard guard for authenticated routes.
- i18n: routes are `app/[locale]/...`; pages read `params: Promise<{ locale: string }>` (Next 16
  async params) and call `getTranslations(namespace)` (server) or `useTranslations(namespace)`
  (client). New user-facing strings go in **both** `messages/es.json` and `messages/en.json` under
  the matching namespace — es is authoritative, keep keys identical between the two files.
- Styling: TailwindCSS utility classes inline; no CSS modules or styled-components.
- Images/video behind auth use `components/images/authenticated-image.tsx` /
  `components/videos/authenticated-video.tsx` (they attach the bearer token rather than hitting the
  URL directly), not a plain `<img>`/`<video>` tag, for anything under `/uploads` or similar
  protected storage routes.
- Testing: Jest + Testing Library, hooks tested via `renderHook` with `apiClient` mocked
  (`jest.mock('@/lib/api-client', ...)`) and a fresh `QueryClientProvider` wrapper per test (retry
  disabled). Shared fixtures in `hooks/__mocks__/test-utils.ts` / `__mocks__/`. Coverage is
  collected from `hooks/`, `lib/`, `components/` (see `jest.config.js`).
- Commits: this repo predates the Conventional Commits convention used in `specialist-be` — recent
  history mixes `feat(scope): ...`, `fix: ...`, and free-form messages. Prefer
  `feat(scope): ...` / `fix: ...` / `docs: ...` going forward for consistency with the backend.

## Gotchas

- **`types/index.ts` is hand-maintained**, not generated from `specialist-shared` or the backend.
  When a backend DTO changes shape (new/renamed field, enum value), update this file by hand —
  nothing will fail to compile otherwise, you'll just get runtime shape drift. `specialist-admin`
  consumes `@specialist/shared` for this purpose; this repo does not (yet).
- `NEXT_PUBLIC_API_URL` (default `http://localhost:5000`) drives both the axios `baseURL` and a
  Next.js `rewrites()` proxy for `/api/:path*`. Two different ways to reach the same backend exist
  in this codebase — prefer `apiClient` (axios) in hooks; don't add new `fetch('/api/...')` calls
  without checking which path an existing feature already uses.
- The default locale is `es` and is hardcoded as a fallback in several places (e.g.
  `protected-layout.tsx` redirects to `/es/login`, `api-client.ts`'s 401 handler reads
  `window.location.pathname.split('/')[1] || 'es'`) rather than importing `defaultLocale` from
  `i18n.ts`. Follow the existing pattern in a file rather than mixing both.
- Next.js 16 removed the `next lint` subcommand; linting runs via the ESLint CLI directly
  (`"lint": "eslint ."`) against a flat `eslint.config.mjs` that imports
  `eslint-config-next/core-web-vitals` (native flat-config export, no `FlatCompat`/`.eslintrc.json`
  needed). `eslint-config-next` and `eslint` are pinned to `^16.0.10`/`^9.39.0` to match — both
  need `eslint-config-next`'s peer dep `eslint >=9.0.0`, which the old `^8.55.0` didn't satisfy.
- No `.claude/rules` enforcement test exists in this repo (unlike `specialist-be`'s
  `architecture.spec.ts`) — these are documented conventions, not fitness-function-enforced ones.
