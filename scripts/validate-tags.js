const fs = require('node:fs');
const path = require('node:path');

const testDirs = [
  path.join(process.cwd(), 'tests', 'api'),
  path.join(process.cwd(), 'tests', 'e2e'),
  path.join(process.cwd(), 'tests', 'smoke'),
];

const requiredLayer = /@(api|e2e)\b/;
const requiredSuite = /@(smoke|regression)\b/;
const testCall = /\btest\s*\(\s*(["'`])([\s\S]*?)\1\s*,/g;

const failures = [];

for (const dir of testDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith('.ts')) continue;
    const file = path.join(dir, entry);
    const content = fs.readFileSync(file, 'utf8');

    let match;
    while ((match = testCall.exec(content)) !== null) {
      const name = match[2];
      if (!requiredLayer.test(name) || !requiredSuite.test(name)) {
        failures.push({ file: path.relative(process.cwd(), file), name });
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Tag validation failed. Each test title must include one layer tag (@api/@e2e) and one suite tag (@smoke/@regression).');
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.name}`);
  }
  process.exit(1);
}

console.log('Tag validation passed.');
