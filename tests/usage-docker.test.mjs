import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, copyFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

test('the Docker runner includes all files needed by the durable usage retry command', async t => {
  const dockerfile = await readFile(new URL('../Dockerfile', import.meta.url), 'utf8');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wenan-usage-docker-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const [, source, destination] of dockerfile.matchAll(/^COPY --from=builder \/app\/(\S+\.mjs) (\.\/\S+\.mjs)\s*$/gm)) {
    const output = path.join(directory, destination);
    await mkdir(path.dirname(output), { recursive: true });
    await copyFile(new URL('../' + source, import.meta.url), output);
  }
  const result = spawnSync(process.execPath, ['scripts/usage-retry.mjs'], {
    cwd: directory, encoding: 'utf8',
    env: { ...process.env, MAIN_APP_URL: '', USAGE_MONITOR_INTERNAL_SECRET: '' },
  });
  assert.equal(result.status, 0, result.stderr);
});
