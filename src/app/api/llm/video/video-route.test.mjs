import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const routeUrl = new URL("./route.ts", import.meta.url);
const pageSource = readFileSync(new URL("../../../page.tsx", import.meta.url), "utf8");

test("video parser posts uploaded local video to the server-side Gemini video route", () => {
  assert.match(pageSource, /fetch\("\/api\/llm\/video"/);
  assert.match(pageSource, /mimeType/);
  assert.match(pageSource, /base64Data/);
});

test("video upload status is distinct from parsed-and-filled status", () => {
  assert.equal(pageSource.includes("已成功装载待拆解视频源"), false);
  assert.match(pageSource, /videoParseStatus/);
  assert.match(pageSource, /视频已装载，点击下方按钮开始解析/);
  assert.match(pageSource, /AI 已解析并回填右侧字段/);
});

test("Gemini video route tries flash three times before pro fallback", () => {
  assert.equal(existsSync(routeUrl), true, "video route should exist");

  const routeSource = readFileSync(routeUrl, "utf8");
  assert.match(routeSource, /GEMINI_VIDEO_API_KEY/);
  assert.match(routeSource, /GEMINI_VIDEO_MODEL/);
  assert.match(routeSource, /gemini-3\.5-flash/);
  assert.match(routeSource, /GEMINI_VIDEO_FALLBACK_MODEL/);
  assert.match(routeSource, /gemini-3\.1-pro/);
  assert.match(routeSource, /FLASH_ATTEMPTS\s*=\s*3/);
  assert.match(routeSource, /for \(let attempt = 1; attempt <= FLASH_ATTEMPTS; attempt \+= 1\)/);
  assert.match(routeSource, /models\/\$\{encodeURIComponent\(model\)\}:generateContent/);
});
