# Architecture

## Runtime Layout

- `src/index.ts`: process entrypoint
- `src/app/createApp.ts`: Express wiring
- `src/config/env.ts`: env parsing and fail-fast validation
- `src/db/client.ts`: Postgres access and health check
- `src/middlewares/*`: correlation, auth, request logging, global errors
- `src/routes/*`: transport layer
- `src/services/*`: business logic and validation
- `src/types/domain.ts`: shared domain types/constants

## Request Lifecycle

1. Correlation middleware assigns/propagates `x-correlation-id`
2. Request logger captures method/path/status/duration
3. Route handler delegates to service layer
4. Service layer executes validation + DB operations
5. Error handler maps known errors to safe API envelopes

## Data and Determinism

- DB schema and seed are deterministic in `db/init.sql`
- Test records are isolated with `run_id`
- Cleanup endpoint allows stable teardown per run

## Environment

Required variables:

- `DATABASE_URL`

Optional:

- `PORT` (default `3000`)
- `DB_DEBUG` (`true` enables query-level debug logging)
