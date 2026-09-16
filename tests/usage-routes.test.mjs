import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

async function route(file, stubs) {
  const code = ts.transpileModule(await readFile(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in stubs) return stubs[name];
    throw new Error('Unexpected import: ' + name);
  }, loaded, loaded.exports);
  return loaded.exports;
}

test('chat reporting uses signed SSO identity, keeps provider fallback and logs every actual retry', async t => {
  const { createUsageMonitor } = await import('../src/app/lib/server/usage-monitor.mjs');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wenan-chat-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const reports = [];
  let calls = 0;
  const previousFetch = globalThis.fetch;
  const previousEnv = { ...process.env };
  Object.assign(process.env, { GEMINI_API_KEY: 'fake', GEMINI_API_BASE_URL: 'https://api.openlux.ai/v1', GEMINI_MODEL: 'gemini-3.5-flash', GEMINI_FALLBACK_MODEL: 'gemini-3.1-pro-preview' });
  globalThis.fetch = async () => ++calls === 1 ? Response.json({ error: 'retry' }, { status: 503 })
    : Response.json({ choices: [{ message: { content: 'private response' } }], usage: { prompt_tokens: 20, completion_tokens: 3 } });
  t.after(() => { globalThis.fetch = previousFetch; process.env = previousEnv; });
  const monitor = createUsageMonitor({ tool: 'wenan', autoDrain: false, config: () => ({ directory, endpoint: 'https://main.test/api/sso/usage', secret: 'fake' }), fetchImpl: async (url, init) => {
    if (String(url).startsWith('https://main.test')) { reports.push(JSON.parse(init.body)); return Response.json({ success: true }); }
    return globalThis.fetch(url, init);
  } });
  const handlers = await route('../src/app/api/llm/chat/route.ts', {
    'next/server': { NextResponse: Response },
    '@/app/lib/server/app-session': { sessionErrorResponse: async () => null, readAppSession: async () => ({ user: { id: 'verified-alice' } }) },
    '@/app/lib/server/usage-monitor.mjs': { usageMonitor: monitor },
  });
  const response = await handlers.POST(new Request('https://tool.test/api/llm/chat', { method: 'POST', body: JSON.stringify({ userId: 'forged', messages: [{ role: 'user', content: 'private prompt' }] }) }));
  assert.equal(response.status, 200);
  await monitor.drain();
  const terminal = reports.filter(event => event.status !== 'pending');
  assert.equal(terminal.length, 2);
  assert.ok(terminal.every(event => event.userId === 'verified-alice'));
  assert.equal(terminal[0].requestId === terminal[1].requestId, false);
  assert.equal(terminal.find(event => event.status === 'completed').totalTokens, 23);
});

test('background video parse keeps submitting owner and denies another employee polling', async t => {
  const { createUsageMonitor } = await import('../src/app/lib/server/usage-monitor.mjs');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wenan-video-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const reports = [];
  const previousEnv = { ...process.env };
  Object.assign(process.env, { GEMINI_VIDEO_API_KEY: 'fake', GEMINI_VIDEO_API_BASE_URL: 'https://api.openlux.ai/v1', GEMINI_VIDEO_API_PROTOCOL: 'openai' });
  t.after(() => { process.env = previousEnv; });
  const monitor = createUsageMonitor({ tool: 'wenan', autoDrain: false, config: () => ({ directory, endpoint: 'https://main.test/api/sso/usage', secret: 'fake' }), fetchImpl: async (url, init) => {
    if (String(url).startsWith('https://main.test')) { reports.push(JSON.parse(init.body)); return Response.json({ success: true }); }
    return Response.json({ choices: [{ message: { content: 'transcript' } }], usage: { prompt_tokens: 100, completion_tokens: 25 } });
  } });
  const session = async request => ({ user: { id: request.headers.get('employee') || 'alice' } });
  const handlers = await route('../src/app/api/llm/video/route.ts', {
    'next/server': { NextResponse: Response },
    '@/app/lib/server/app-session': { sessionErrorResponse: async () => null, readAppSession: session, assertAppSessionFromRequest: session },
    '@/app/lib/server/usage-monitor.mjs': { usageMonitor: monitor },
  });
  const created = await handlers.POST(new Request('https://tool.test/api/llm/video', { method: 'POST', headers: { 'Content-Type': 'application/json', employee: 'alice' }, body: JSON.stringify({ mimeType: 'video/mp4', base64Data: 'AAAA', prompt: 'private' }) }));
  assert.equal(created.status, 202);
  const { jobId } = await created.json();
  for (let attempt = 0; attempt < 30; attempt++) {
    const own = await handlers.GET(new Request('https://tool.test/api/llm/video?jobId=' + jobId, { headers: { employee: 'alice' } }));
    const job = await own.json();
    if (job.status === 'succeeded') break;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  const denied = await handlers.GET(new Request('https://tool.test/api/llm/video?jobId=' + jobId, { headers: { employee: 'bob' } }));
  assert.equal(denied.status, 404);
  await monitor.drain();
  assert.equal(reports.filter(event => event.status === 'completed').length, 1);
  assert.ok(reports.every(event => event.userId === 'alice'));
});
