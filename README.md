# Express API

REST API built with Express 5, TypeScript, Prisma (PostgreSQL) and Zod.

> **Uses [Vite+](https://viteplus.dev/)**
>
> Vite+ (`vp`) handles linting, formatting, testing and type checking. Its settings are in `vite.config.ts`. The `pnpm` scripts below call it for you, and you can also run `vp` directly:
>
> ```sh
> pnpm exec vp check   # format, lint and type check
> pnpm exec vp lint
> pnpm exec vp fmt
> pnpm exec vp test
> ```
>
> If `vp` is installed globally, you can drop the `pnpm exec` prefix.

## Features

- Email/password sign up and login with JWT access and refresh tokens
- Google OAuth login
- Email verification and password reset, with emails sent through AWS SES
- Role-based access (`ADMIN`, `USER`)
- Request validation with Zod
- Rate limiting per IP and per user
- OpenAPI docs generated from the Zod schemas (Swagger UI)
- Error tracking with Sentry

## Tech stack

| Area      | Tools                                           |
| --------- | ----------------------------------------------- |
| Runtime   | Node.js, Express 5, TypeScript                  |
| Database  | PostgreSQL, Prisma 7 (`@prisma/adapter-pg`)     |
| Auth      | jsonwebtoken, bcryptjs, google-auth-library     |
| Docs      | zod-to-openapi, swagger-ui-express              |
| Tooling   | pnpm, Vite+ (lint, format, test), Husky         |
| Monitoring| Sentry                                          |

## Project structure

The code follows a ports and adapters (hexagonal) layout. Business rules live in `core/` and don't depend on Express, Prisma or AWS. Everything else plugs into them.

> The code is being moved to this layout step by step, so some files may still be in their old locations.

```
prisma/                                # Prisma schema and migrations
tests/                                 # tests
src/
├── core/                              # business rules. Imports only core/ (+ zod, node:crypto)
│   ├── errors.ts                      # InvalidCredentialsError, NotFoundError…
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── token.service.ts
│   │   ├── email-verification.service.ts   # account rule, not an email concern
│   │   └── ports.ts                   # ITokenSigner, IPasswordHasher, IIdentityProvider
│   ├── users/
│   │   ├── user.service.ts
│   │   └── user-repository.port.ts
│   ├── email/
│   │   ├── email.service.ts
│   │   ├── email-templates.ts
│   │   └── email-provider.port.ts     # IEmailProvider
│   └── logs/
│       └── log.service.ts
│
├── infrastructure/                    # adapters that implement core's ports
│   ├── database/prisma.ts
│   ├── repositories/                  # prisma-user.repository.ts, prisma-log.repository.ts…
│   ├── email/ses-email.provider.ts
│   └── auth/                          # jwt-token-signer.ts, google-identity.provider.ts
│
├── http/                              # Express adapter
│   ├── app.ts
│   ├── swagger.ts
│   ├── routes/  controllers/  middlewares/  validators/  dtos/
│   └── health/                        # health checks: about the server, not business rules
│
├── config/
│   ├── env.ts
│   └── constants/
│
└── main/                              # composition root: the only place that wires everything together
    ├── container.ts                   # creates repositories and services
    ├── instrument.ts                  # Sentry setup, loaded first
    └── index.ts                       # entry point
```

### Where new code goes

| You are adding…                                   | Put it in                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| A business rule or use case                       | a service in `core/<feature>/`                     |
| Something core needs from the outside world (DB, email, tokens) | a port (interface) in `core/<feature>/`, then an adapter in `infrastructure/` |
| A Prisma query                                    | `infrastructure/repositories/`                     |
| An endpoint                                       | route, controller, validator and DTO in `http/`    |
| An env variable                                   | `config/env.ts` (and the list in this README)      |
| Wiring a new service or adapter                   | `main/container.ts`                                |

Dependency rule: `core/` never imports from `infrastructure/`, `http/`, `config/` or `main/`. Dependencies always point inward, toward `core/`.

## Getting started

Requirements: Node.js, pnpm and a PostgreSQL database.

```sh
pnpm install
pnpm prisma:generate
```

Create a `.env` file in the project root:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/db
APP_URL=http://localhost:3000        # frontend URL, used in email links
BASE_URL=http://localhost:4000       # this API's public URL
JWT_SECRET_KEY=change-me
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
AWS_SES_SENDER=noreply@example.com
AWS_SES_REGION=us-east-1

# Optional (defaults shown)
PORT=4000
NODE_ENV=development                 # development | production | test
CORS_ORIGIN=*                        # comma-separated list of origins
ACCESS_TOKEN_EXPIRE=86400000         # ms, 1 day
REFRESH_TOKEN_EXPIRE=7776000000      # ms, 90 days
EMAIL_VERIFICATION_EXPIRE=86400000   # ms, 1 day
PASSWORD_RESET_EXPIRE=3600000        # ms, 1 hour
SENTRY_DSN=
SENTRY_ENV=development               # development | staging | production
```

Apply migrations and start the dev server:

```sh
pnpm db:migrate
pnpm dev
```

The API runs at `http://localhost:4000/api`.

## API

| Method | Path                            | Auth   | Description                    |
| ------ | ------------------------------- | ------ | ------------------------------ |
| GET    | `/api/health`                   |        | Health check                   |
| GET    | `/api/ready`                    |        | Readiness check                |
| POST   | `/api/auth/signup`              |        | Sign up with email/password    |
| POST   | `/api/auth/login`               |        | Log in with email/password     |
| POST   | `/api/auth/google/callback`     |        | Log in with Google             |
| POST   | `/api/auth/verify-email`        | Bearer | Verify email address           |
| POST   | `/api/auth/resend-verification` | Bearer | Resend verification email      |
| POST   | `/api/auth/refresh-token`       |        | Get a new access token         |
| POST   | `/api/auth/forgot-password`     |        | Request a password reset email |
| POST   | `/api/auth/reset-password`      |        | Set a new password             |
| GET    | `/api/me`                       | Bearer | Current user                   |
| GET    | `/api/sentry/debug`             |        | Throws a test error for Sentry |

Outside production, interactive docs are at `/api-docs` (basic auth `admin` / `admin`) and the raw spec at `/openapi.json`.

## Scripts

| Command                | Runs                          | Description                                |
| ---------------------- | ----------------------------- | ------------------------------------------ |
| `pnpm dev`             | `vpx watch src/index.ts`      | Start in watch mode                        |
| `pnpm build`           | `tsc`                         | Compile TypeScript to `build/`             |
| `pnpm start`           | `node build/src/index.js`     | Run the compiled build                     |
| `pnpm exec vp test`    | `vp test`                     | Run tests                                  |
| `pnpm lint`            | `vp lint`                     | Lint                                       |
| `pnpm format`          | `vp fmt`                      | Format                                     |
| `pnpm check`           | `vp check`                    | Format, lint and type check                |
| `pnpm typecheck`       | `tsc --noEmit`                | Type check only                            |
| `pnpm db:generate`     | `prisma migrate dev`          | Create a new migration from schema changes |
| `pnpm db:migrate`      | `prisma migrate deploy`       | Apply migrations                           |
| `pnpm db:reset`        | `prisma migrate reset`        | Reset the database                         |
| `pnpm db:studio`       | `prisma studio`               | Open Prisma Studio                         |
| `pnpm prisma:generate` | `prisma generate`             | Generate the Prisma client                 |

## Git workflow

This project follows [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow). `main` must always work. Every change goes through a short-lived branch and a pull request.

1. Create a branch from an up-to-date `main`:
   ```sh
   git switch main
   git pull
   git switch -c fix/refresh-token-expiry
   ```
2. Commit your changes using the [commit message format](#commit-messages).
3. Run `pnpm check` and `pnpm exec vp test` before pushing.
4. Push and open a pull request into `main`:
   ```sh
   git push -u origin fix/refresh-token-expiry
   ```
5. After merging, delete the branch.

### Branch names

Use `type/short-description`, in lowercase with dashes. If there is a GitHub issue, include its number: `fix/42-refresh-token-expiry`.

| Prefix      | Use for                                     | Example                      |
| ----------- | ------------------------------------------- | ---------------------------- |
| `feat/`     | New feature                                 | `feat/file-upload`           |
| `fix/`      | Bug fix                                     | `fix/refresh-token-expiry`   |
| `hotfix/`   | Urgent fix for something broken in production | `hotfix/login-500`         |
| `refactor/` | Code changes that don't change behavior     | `refactor/auth-service`      |
| `test/`     | Adding or fixing tests                      | `test/me-route`              |
| `docs/`     | README and other docs                       | `docs/env-variables`         |
| `chore/`    | Dependencies, config, tooling               | `chore/update-prisma`        |

### Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `type: short description`, using the same types as branch names.

```
feat: add file upload endpoint
fix: use correct expiry for refresh tokens
chore: update prisma to 7.11
```

## Deployment

```sh
pnpm install --prod=false
pnpm prisma:generate
pnpm build
pnpm sentry:sourcemaps   # optional, needs SENTRY_AUTH_TOKEN
pnpm db:migrate
pnpm start
```
