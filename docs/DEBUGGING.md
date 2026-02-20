# Debugging Guide

## Local Repro

```bash
npm run docker:up
npm test
```

## Useful Artifacts

- `playwright-report/` for HTML summary
- `test-results/` for trace/video/screenshot attachments
- CI `sut-logs-*` artifacts for app + db logs

## Trace Inspection

```bash
npx playwright show-trace test-results/<path-to-trace>.zip
```

## Correlation

- API client sends `x-correlation-id` and `x-test-id`
- Server logs include both fields for request tracing
