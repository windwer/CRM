# Diagnosis — "missing required error components, refreshing..."

## Root Cause

`src/app/error.tsx` was using `useTranslations("errors")` from `next-intl`.

Error boundaries are rendered by Next.js AFTER the failing subtree is unmounted.
Depending on when the error fires (e.g., before the `NextIntlClientProvider` is hydrated,
or during hydration itself), `useTranslations` can throw because the context it depends on
is not yet available. This creates a self-reinforcing loop:

1. Page component throws
2. Next.js renders `error.tsx`
3. `useTranslations` inside `error.tsx` throws (no IntlProvider context)
4. Next.js can't render the error component → "missing required error components, refreshing..."
5. Browser refreshes → repeat from step 1

## Missing Files

| File | Status |
|------|--------|
| `src/app/error.tsx` | ✅ Existed, but broken (useTranslations) |
| `src/app/global-error.tsx` | ❌ Missing (last-resort boundary) |
| `src/app/dashboard/(dashboard)/error.tsx` | ❌ Missing (dashboard scope) |

## Fix Applied

1. `src/app/error.tsx` — Removed `useTranslations`, replaced with hardcoded strings + `useEffect` console log
2. `src/app/global-error.tsx` — Created from scratch (includes `<html><body>`)
3. `src/app/dashboard/(dashboard)/error.tsx` — Created dashboard-level boundary

## Dev Server Logs

- No compilation errors
- `GET /dashboard` → 200 (page renders correctly)
- `GET /api/health` → 200
- Webpack cache warnings (non-fatal, pre-existing)
