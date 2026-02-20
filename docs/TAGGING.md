# Tagging

## Required Tags

Every test must include:

- one layer tag: `@api` or `@e2e`
- one suite tag: `@smoke` or `@regression`

## Optional Capability Tags

- `@contract`
- `@auth`
- `@negative`
- `@pagination`
- `@filtering`
- `@search`
- `@sorting`
- `@db`
- `@quarantine`

## Examples

- `@api @regression @pagination list supports page boundaries`
- `@e2e @regression delete task via UI`
- `@api @smoke @db healthcheck reports db availability`

## Tag-Driven Commands

- `npm run test:smoke`
- `npm run test:regression`
- `npm run test:api`
- `npm run test:e2e`
- `npm run test:auth`
- `npm run test:negative`
- `npm run test:ci` (excludes `@quarantine`)
