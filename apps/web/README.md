# Saiyan Ascend web (Next.js)

Member web shell and administration portal for Milestone 1.

## Start

From the monorepo root (API should already be running on port 3001):

```bash
pnpm web:dev
```

Or:

```bash
pnpm --filter @saiyan/web dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Set in root `.env` or `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The web client calls `NEXT_PUBLIC_API_URL/api/v1/*` with `credentials: 'include'` and
`Accept: application/json; auth=cookie` so the API can set HttpOnly session cookies.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Marketing home with brand hero |
| `/login` | Sign in |
| `/register` | Create account |
| `/app` | Authenticated member Today shell |
| `/today` | Alias → `/app` |
| `/admin` | ADMIN-only shell (MEMBER denied) |
| `/fr/*`, `/es/*` | French / Spanish locales (`en` is default, no prefix) |
| `/health` | Web liveness JSON |

## Scripts

- `pnpm --filter @saiyan/web dev`
- `pnpm --filter @saiyan/web build`
- `pnpm --filter @saiyan/web lint`
