---
paths:
  - "**/__tests__/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "jest.config.js"
  - "jest.setup.js"
  - "__mocks__/**"
---

# Testing (Jest + Testing Library)

- Tests live next to what they cover, in an `__tests__/` folder (e.g. `hooks/__tests__/`), suffix
  `.test.ts`/`.test.tsx`. Coverage is collected from `hooks/`, `lib/`, `components/`
  (`jest.config.js`); there's no e2e suite in this repo.
- Hook tests mock `@/lib/api-client` wholesale (`jest.mock('@/lib/api-client', () => ({
  __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete:
  jest.fn() } }))`) and cast it `as jest.Mocked<typeof apiClient>` — don't hit the real network or
  MSW; this codebase's convention is a bare jest mock of the axios instance.
- Wrap hooks under test in a fresh `QueryClientProvider` per test with `retry: false` on both
  queries and mutations (see `createWrapper()` in `hooks/__tests__/use-requests.test.tsx`), so
  failing-request tests don't hang on retry backoff.
- Shared fixtures/factories (e.g. `createMockRequest`) live in `hooks/__mocks__/test-utils.ts` /
  top-level `__mocks__/` — extend an existing factory rather than inlining a new fixture shape
  when testing an existing resource.
- Run a single spec instead of the whole suite while iterating: `npm test -- <path-to-spec>`.
