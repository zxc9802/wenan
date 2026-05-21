import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, "..");
const projectRoot = path.join(appRoot, "..", "..");

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

test("copywriting app declares a signed main-site SSO session", async () => {
  const source = await read("src/app/lib/server/app-session.ts");

  assert.match(source, /DEFAULT_MAIN_APP_ENTRY_PATH = "\/bot\/copywriting-agent"/);
  assert.match(source, /DEFAULT_MAIN_APP_SSO_EXCHANGE_PATH = "\/api\/copywriting-agent-sso\/exchange"/);
  assert.match(source, /DEFAULT_SESSION_COOKIE_NAME = "copywriting_agent_session"/);
  assert.match(source, /COPYWRITING_AGENT_SESSION_SECRET/);
  assert.match(source, /exchangeMainAppSsoTicket/);
  assert.match(source, /buildSessionCookie/);
});

test("copywriting app proxy exchanges SSO tickets and redirects failures to the main site", async () => {
  const source = await read("proxy.ts");

  assert.match(source, /export async function proxy/);
  assert.match(source, /exchangeMainAppSsoTicket/);
  assert.match(source, /buildSessionCookie/);
  assert.match(source, /ssoError/);
  assert.match(source, /ticket_exchange_failed/);
});

test("copywriting app exposes session state and protects server APIs", async () => {
  const sessionRoute = await read("src/app/api/session/route.ts");
  const llmRoute = await read("src/app/api/llm/chat/route.ts");
  const feishuRoute = await read("src/app/api/feishu/sync/route.ts");

  assert.match(sessionRoute, /assertAppSessionFromRequest/);
  assert.match(sessionRoute, /requiresSso/);
  assert.match(llmRoute, /sessionErrorResponse/);
  assert.match(feishuRoute, /sessionErrorResponse/);
});

test("copywriting app scopes browser data by SSO user id", async () => {
  const source = await read("src/app/page.tsx");

  assert.match(source, /\/api\/session/);
  assert.match(source, /getScopedStorageKey/);
  assert.match(source, /copywriting-agent-local-dev-user/);
  assert.match(source, /storageScope/);
  assert.match(source, /persistCases\(storageScope/);
  assert.match(source, /persistMaterials\(storageScope/);
});

test("copywriting app documents main-site SSO environment variables", async () => {
  const source = await read(".env.example");

  assert.match(source, /MAIN_APP_URL=https:\/\/www\.qycm\.top/);
  assert.match(source, /MAIN_APP_COPYWRITING_AGENT_ENTRY_PATH=\/bot\/copywriting-agent/);
  assert.match(source, /MAIN_APP_COPYWRITING_AGENT_SSO_EXCHANGE_PATH=\/api\/copywriting-agent-sso\/exchange/);
  assert.match(source, /REQUIRE_MAIN_APP_SSO=true/);
  assert.match(source, /COPYWRITING_AGENT_SESSION_SECRET=/);
  assert.match(source, /COPYWRITING_AGENT_SESSION_COOKIE_NAME=copywriting_agent_session/);
}
);
