# QA Automation Framework (Playwright + API + Docker + CI)

Framework de automação com foco em qualidade de engenharia: testes API + E2E, execução determinística via Docker Compose, CI com artifacts e diagnóstico de falhas (trace/screenshot/video).

## Arquitetura (ASCII)
```text
                    +---------------------------+
                    |      GitHub Actions       |
                    | lint + tests + artifacts  |
                    +-------------+-------------+
                                  |
                                  v
+-------------------+   HTTP   +-------------------+   SQL   +------------------+
| Playwright Runner +--------->+ Node/Express SUT  +------->+ PostgreSQL        |
| API + E2E specs   |          | 127.0.0.1:3000    |        | 5432 (container)  |
+---------+---------+          +-------------------+        +------------------+
          |
          v
 +------------------------------+
 | test-results / report HTML   |
 | trace, screenshot, video     |
 +------------------------------+
```

## Stack
- TypeScript
- Playwright (`@smoke` e `@regression`)
- Node/Express (SUT)
- Postgres
- Docker Compose
- GitHub Actions
- ESLint (`@typescript-eslint`)

## Subir stack e executar local
```bash
cp .env.example .env
npm ci
npm run docker:up
npm run lint
npm test
npm run report
```

## Execução por escopo
- API-only:
```bash
npx playwright test tests/api
```
- E2E-only:
```bash
npx playwright test tests/e2e
```
- Smoke:
```bash
npx playwright test -g "@smoke"
```
- Regression:
```bash
npx playwright test -g "@regression"
```

## Coleta de artifacts e diagnóstico
- `playwright-report/`: relatório HTML (`npm run report`).
- `test-results/`: traces, screenshots e videos em falhas.
- Configuração atual:
  - `trace: on-first-retry`
  - `screenshot: only-on-failure`
  - `video: retain-on-failure`
- CI faz upload de `playwright-report` e `test-results` em todos os cenários (`if: always()`).

## CI (igual ao local)
- Pipeline executa:
  1. `npm ci`
  2. start da stack com Docker Compose
  3. healthcheck do SUT
  4. `npm run lint`
  5. `npm test`
  6. upload de artifacts

## Commits e versionamento mínimo
```bash
git add .
git commit -m "Fix: pg typings; stabilize baseURL; tests green"
git tag v1.0.0
```
