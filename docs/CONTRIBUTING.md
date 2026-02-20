# Contributing

## Local Quality Checklist

Before pushing changes:

```bash
npm ci
npm run lint
npm run docker:up
npm test
```

## Code Style Rules

- Keep logic in services, not routes
- Keep routes thin and transport-focused
- Prefer explicit validation errors over generic 500s
- Keep tests deterministic and isolated by `runId`
- Do not add abstractions unless they reduce duplication or failure risk

## Test Authoring Rules

- Include mandatory tags (`@api|@e2e` + `@smoke|@regression`)
- Add capability tags only when they improve discoverability
- Prefer API tests for rule permutations
- Keep E2E scope to business-critical journeys
