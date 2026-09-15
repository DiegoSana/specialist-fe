---
paths:
  - "lib/auth.ts"
  - "lib/api-client.ts"
  - "hooks/use-auth.ts"
  - "components/layout/**"
  - "components/verification/**"
  - "app/[locale]/login/**"
  - "app/[locale]/register/**"
  - "app/[locale]/profile-setup/**"
---

# Auth & role gating

- Session is `localStorage`-only: `AUTH_TOKEN_KEY = 'token'`, `USER_KEY = 'user'`
  (`lib/auth.ts`). There is no refresh token and no httpOnly cookie — treat the token as readable
  by any script on the page (XSS surface), don't add anything that assumes cookie-based auth.
- `setUser` dispatches a `userUpdated` `CustomEvent` on `window` after writing to storage; listen
  for that event (rather than polling `getUser()`) if a component needs to react to profile
  changes made elsewhere on the page without a full reload.
- A user can hold multiple profiles simultaneously. Gate UI on the boolean flags —
  `user.hasClientProfile`, `user.hasProfessionalProfile`, `user.hasCompanyProfile`, `user.isAdmin`
  — never on a single `role` field (there isn't one). This mirrors the backend's composition model
  (`ProfessionalStatus`/`CompanyStatus`/`ClientStatus` are independent of `User.status`).
  `phoneVerified`/`emailVerified` are separate booleans from profile existence.
- `ProtectedLayout` (`components/layout/protected-layout.tsx`) is the standard client-side guard:
  redirects to `/es/login` if `!isAuthenticated()`, and to `/es/profile-setup` if
  `requireProfile` (default `true`) and the user has neither a client nor a professional profile.
  Reuse it instead of writing a new `useEffect` auth check per page.
- `useLogin()`/`useRegister()` (`hooks/use-auth.ts`) decide the post-auth redirect based on which
  profile flags are set on the returned user — check that logic before adding a new redirect
  branch so a new profile type doesn't get silently dropped.
- On a 401 from a non-auth endpoint, `apiClient`'s response interceptor already clears storage and
  redirects — don't add a second 401 handler in a hook or component.
