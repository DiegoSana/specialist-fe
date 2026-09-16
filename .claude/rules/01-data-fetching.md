---
paths:
  - "hooks/**"
  - "lib/api-client.ts"
  - "components/**"
  - "app/**"
---

# Data fetching & server state

- One hook file per resource in `hooks/` (`use-requests.ts`, `use-professionals.ts`, ...), built on
  `@tanstack/react-query`. Either the generic `useApiQuery(queryKey, url, options)`
  (`hooks/use-api-query.ts`) for simple GETs, or a hand-written `useQuery`/`useMutation` when you
  need custom `queryFn` logic (query params, POST/PATCH/DELETE) or `onSuccess` side effects.
- Query keys are arrays: `['requests', 'client']`, `['request', id]`, `['requests', 'available',
  city, zone]`. Keep the first element the resource name so `queryClient.invalidateQueries({
  queryKey: ['requests'] })` can invalidate every related query.
- Mutations invalidate the queries they affect in `onSuccess`, e.g. after creating a request,
  invalidate `['requests', 'client']`. Don't rely on `staleTime`/refetch-on-focus alone to pick up
  writes.
- Never call `apiClient` (or `axios`) directly from a component or page — add or extend a hook in
  `hooks/` so the request shape, error handling and query key live in one testable place.
- `apiClient` (`lib/api-client.ts`) already attaches the bearer token and handles 401 globally
  (redirect to login, except on `/auth/login` and `/auth/register`). Don't add a second axios
  instance or duplicate the interceptor logic.
- Components/pages under `app/**` are Server Components by default (can be `async`, can call
  `getTranslations` directly). Add `'use client'` at the top of the file only when it uses a hook,
  `useState`/`useEffect`, an event handler, or a browser-only API — push client boundaries as low
  in the tree as practical rather than marking a whole page client-side.
