'use strict';
// Entry point for `node --test tests/`.
//
// The test runner resolves a directory argument as a module path, which
// lands here. The real suites live in tests/*.test.mjs (also runnable
// directly, e.g. `node --test "tests/*.test.mjs"`); each is imported inside
// its own test below so the single mandated command runs the whole suite
// on every Node version. Zero dependencies.

const { readdirSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { it } = require('node:test');

const files = readdirSync(__dirname).filter((f) => f.endsWith('.test.mjs')).sort();
for (const f of files) {
  it(`suite ${f}`, async () => {
    await import(pathToFileURL(path.join(__dirname, f)).href);
  });
}
