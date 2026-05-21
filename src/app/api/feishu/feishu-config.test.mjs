import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const pageSource = readFileSync(new URL("../../page.tsx", import.meta.url), "utf8");
const feishuRouteSource = readFileSync(new URL("./sync/route.ts", import.meta.url), "utf8");
const llmRouteSource = readFileSync(new URL("../llm/chat/route.ts", import.meta.url), "utf8");

test("Feishu connector fields are not rendered or stored by the front end", () => {
  [
    "飞书应用 App ID",
    "飞书 App Secret",
    "多维表 App Token",
    "IP 定位子表ID",
    "公司案例库子表ID",
    "高手素材库子表ID",
    "内容表现复盘子表ID",
    "xz_feishu_app_id",
    "xz_feishu_app_secret",
    "xz_feishu_app_token",
    "xz_feishu_ip_table_id",
    "xz_feishu_cases_table_id",
    "xz_feishu_materials_table_id",
    "xz_feishu_performance_table_id",
  ].forEach((forbiddenText) => {
    assert.equal(pageSource.includes(forbiddenText), false, `${forbiddenText} should not appear in page.tsx`);
  });
});

test("Feishu sync route owns fixed connector configuration", () => {
  assert.match(feishuRouteSource, /const FEISHU_CONFIG = /);
  assert.match(feishuRouteSource, /process\.env\.FEISHU_APP_ID/);
  assert.match(feishuRouteSource, /process\.env\.FEISHU_PERFORMANCE_TABLE_ID/);
});

test("LLM connector fields are not rendered or stored by the front end", () => {
  [
    "API Base URL",
    "API Model Name",
    "API Key",
    "保存驱动引擎配置",
    "client-side 直连",
    "xz_api_key",
    "xz_api_base_url",
    "xz_api_model",
  ].forEach((forbiddenText) => {
    assert.equal(pageSource.includes(forbiddenText), false, `${forbiddenText} should not appear in page.tsx`);
  });
});

test("LLM chat route owns server-side model configuration", () => {
  assert.match(llmRouteSource, /process\.env\.LLM_API_KEY/);
  assert.match(llmRouteSource, /process\.env\.LLM_API_BASE_URL/);
  assert.match(llmRouteSource, /process\.env\.LLM_MODEL/);
});
