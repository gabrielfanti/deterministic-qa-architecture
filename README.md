# QA Automation Framework (Playwright + API + Docker + CI)

Production-grade QA automation framework showcasing layered test architecture, deterministic execution, a containerized SUT, CI parity, and strong failure observability.

---

## Architecture

```text
                    +---------------------------+
                    |      GitHub Actions       |
                    |  lint + tests + artifacts |
                    +-------------+-------------+
                                  |
                                  v
+-------------------+   HTTP   +----------------------------------------------+   SQL   +------------------+
| Playwright Runner +--------->+ Application Container                        +------->+ PostgreSQL       |
| API + E2E specs   |          | Node/Express (bind 0.0.0.0, via 127.0.0.1)  |        | Container        |
+---------+---------+          +----------------------------------------------+        +------------------+
          |
          v
 +------------------------------+
 | HTML report + test-results   |
 | trace / screenshot / video   |
 +------------------------------+
```

SUT services (app + database) run through Docker Compose.  
CI runs the same stack as local execution.  
No external environments required.

---

## Test Strategy

Layered automation strategy:

- **API tests**
  - Validates business rules and data integrity at the service layer.
  - Provides faster feedback cycles.
  - Reduces UI dependency.

- **E2E tests**
  - Validates critical user journeys.
  - Exercises the full stack (UI → API → DB).

- **Smoke suite**
  - Protects release confidence.
  - Covers the minimum set of critical flows.

- **Regression suite**
  - Provides full behavioral validation.

Principles:

- Minimize E2E redundancy.
- Validate logic as low in the stack as possible.
- Maintain deterministic test data per run.

---

## Deterministic Execution

- PostgreSQL is initialized via SQL seed on container startup.
- Containers recreated per CI run.
- No shared environments.
- No dependency on external services.
- IPv4 baseURL (`127.0.0.1`) is enforced to avoid macOS IPv6 resolution issues.

CI runs always start from a clean, reproducible state.  
Local runs are clean when containers are recreated with `docker compose down -v`.

---

## Tech Stack

- TypeScript
- Playwright (API + E2E)
- Node.js + Express (SUT)
- PostgreSQL
- Docker Compose
- GitHub Actions
- ESLint (`@typescript-eslint`)

---

## Local Setup and Full Run

```bash
cp .env.example .env
npm ci
npm run docker:up
npm run lint
npm test
npm run report
```

Stop the environment:

```bash
npm run docker:down
```

---

## Test Execution by Scope

API-only:

```bash
npx playwright test tests/api
```

E2E-only:

```bash
npx playwright test tests/e2e
```

Smoke suite:

```bash
npm run test:smoke
```

Regression suite:

```bash
npm run test:regression
```

---

## Failure Observability

On failure, the framework captures:

- HTML report (`playwright-report/`)
- Trace on first retry
- Screenshot on failure
- Video retained on failure
- Raw artifacts in `test-results/`

CI always uploads:

- `playwright-report`
- `test-results`

This enables reproducible debugging directly from pipeline runs.

---

## CI Pipeline (Local Parity)

Pipeline steps:

1. `npm ci`
2. Install Playwright browsers
3. Start SUT stack via Docker Compose
4. Healthcheck validation
5. `npm run lint`
6. `npm test`
7. Upload artifacts

CI uses the same containerized stack as local runs.  
This minimizes environment drift.

---

## Design Decisions & Trade-offs

- **Playwright over Cypress**
  - Native API testing support.
  - Strong parallel execution.
  - Stable CI performance.

- **Docker Compose instead of cloud deployment**
  - Deterministic execution.
  - Low operational cost.
  - Infrastructure parity across environments.

- **Minimal Express SUT**
  - Keeps focus on automation architecture.
  - Isolates test strategy from product complexity.

- **PostgreSQL container**
  - Ensures realistic relational data behavior.
  - Enables reproducible database state.

---

## How This Scales

This framework can evolve to support:

- Microservices (additional service containers).
- Contract testing integration (e.g., Pact).
- Performance stage (k6).
- Parallel CI job distribution.
- Cloud container deployment (AWS ECS / Azure Container Apps) without major architectural change.

The current structure cleanly separates:

- Test logic
- Infrastructure
- Application
- Data layer

This supports architectural growth without major structural refactoring.
