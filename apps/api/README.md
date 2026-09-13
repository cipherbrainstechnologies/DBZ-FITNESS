# @saiyan/api

NestJS modular monolith for Saiyan Ascend (Milestone 1: identity, profiles facade, health).

## Run

From the monorepo root (Postgres required via `pnpm docker:up`):

```bash
pnpm db:generate
pnpm db:migrate
pnpm api:dev
```

API listens on `API_URL` / `PORT` (default `http://localhost:3001`).

## Auth modes

- **Bearer (default):** `POST /api/v1/auth/login` returns `accessToken` + `refreshToken`.
- **Cookie:** send `Accept: application/json; auth=cookie` (or `application/saiyan.auth-cookie+json`) to receive `HttpOnly` cookies instead.

## Self-test

```bash
pnpm --filter @saiyan/api test:self
```

Exercises register → login → `GET /me`, and asserts unauthorized `GET /me` fails.
