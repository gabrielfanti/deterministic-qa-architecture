# Test Strategy

## Layering Rules

- API tests validate business rules, validation, query behavior, and error mapping.
- E2E tests validate only critical end-user journeys.
- Smoke tests validate health and one critical happy path.

## What We Avoid

- Duplicating API permutations in UI tests
- Sleep-based synchronization
- Interdependent tests
- Assertions that depend on implicit DB ordering

## Final Coverage Shape

- API: 12 tests (primary behavior coverage)
- E2E: 4 tests (critical flow coverage)
- Smoke: 2 tests (fast gate)

## Anti-Patterns

- Testing UI framework internals
- Verifying every negative case through browser layer
- Keeping redundant test cases only to increase test count
