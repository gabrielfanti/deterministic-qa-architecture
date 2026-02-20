# QA Automation Framework

QA automation project with a deterministic local stack (Express + Postgres + Playwright), built to show practical test architecture and CI discipline.

## What This Project Covers

- Deterministic full-stack test execution (Docker Compose + seeded Postgres)
- Layered Playwright strategy with governance by tags
- Typed API test utilities and contract assertions
- Observability with correlation IDs, structured logs, and CI artifacts
- CI/local parity with the same SUT topology and quality gates

## Run the App (Task Console UI)

```bash
npm ci
npm run docker:up
```

Open:

- `http://127.0.0.1:3000`

Default users:

- User: `qa-user@example.com` / `password123`
- Admin: `qa-admin@example.com` / `password123`

## Architecture

```text
Playwright (API/E2E) ---> Express SUT ---> PostgreSQL
        |                      |              |
        v                      v              v
  reports/traces/videos     JSON logs      deterministic seed
```

Runtime code boundaries:

- `src/app`: app wiring, request context, logger, typed errors, UI page
- `src/config`: environment loading and validation
- `src/db`: DB client and health probing
- `src/middlewares`: correlation, auth, request logging, global error handler
- `src/routes`: HTTP endpoints
- `src/services`: business logic and validation rules

## Determinism Model

- DB schema + seed is fully defined in `db/init.sql`
- Containers are recreated from scratch with `docker compose down -v`
- Tests generate bounded deterministic IDs (`TEST_RUN_ID` + local suffix)
- Cleanup endpoint removes run-scoped records: `DELETE /api/tasks/testing/run/:runId`
- API sorting is explicit (`created_at, id`) to avoid implicit DB ordering

## Test Strategy (Current)

Final suite count: **18 tests**

- API: 12 (`tests/api/tasks.api.spec.ts`)
- E2E: 4 (`tests/e2e/tasks.e2e.spec.ts`)
- Smoke: 2 (`tests/smoke/smoke.spec.ts`)

Rationale:

- Business rules stay primarily at API layer (faster, less brittle)
- E2E is intentionally minimal for critical user journeys only
- Smoke remains very small for fast feedback

## Tag Taxonomy

Required per test:

- One layer tag: `@api` or `@e2e`
- One suite tag: `@smoke` or `@regression`

Optional capability tags:

- `@contract`, `@auth`, `@negative`, `@pagination`, `@filtering`, `@search`, `@sorting`, `@db`, `@quarantine`

## Run Commands

```bash
npm ci
npm run docker:up
npm run lint
npm test
npm run report
```

Targeted runs:

```bash
npm run test:smoke
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:auth
npm run test:negative
npm run test:ci
```

Stop stack:

```bash
npm run docker:down
```

## Performance Checks (k6)

```bash
npm run perf:smoke
npm run perf:load
npm run perf:stress
```

Smoke thresholds:

- `http_req_duration` p95 < 500ms
- `http_req_failed` rate < 1%

## CI Gates

- Lint gate
- Sharded Playwright regression execution
- Quarantine-aware run (`--grep-invert @quarantine`)
- Flake detection reruns for failures
- k6 smoke threshold gate
- Artifacts: Playwright reports, test-results, k6 reports, SUT logs

## Observability and Debugging Artifacts

- Correlation propagation: `x-correlation-id`
- Test-to-request traceability: `x-test-id`
- Structured JSON logs (secrets redacted)
- Failure artifacts: trace, screenshot, video, HTML report

## Engineering Rationale

This project keeps a realistic but bounded SUT (`tasks` with CRUD + query behavior + optimistic locking) because it is enough to demonstrate:

- API correctness and query coverage
- role-based auth behavior
- deterministic data isolation
- observability and CI controls

Extra E2E permutations were removed because they duplicated API coverage and increased brittleness without improving defect detection.

## Additional Documentation

- `docs/ARCHITECTURE.md`
- `docs/TEST_STRATEGY.md`
- `docs/TAGGING.md`
- `docs/DEBUGGING.md`
- `docs/CONTRIBUTING.md`
