import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const routeUrl = new URL("./route.ts", import.meta.url);
const pageSource = readFileSync(new URL("../../../page.tsx", import.meta.url), "utf8");

test("video parser posts uploaded local video to the server-side Gemini video route", () => {
  assert.match(pageSource, /fetch\("\/api\/llm\/video"/);
  assert.match(pageSource, /mimeType/);
  assert.match(pageSource, /objectKey/);
  assert.match(pageSource, /fetch\("\/api\/r2\/video-upload"/);
  assert.match(pageSource, /FormData/);
  assert.doesNotMatch(pageSource, /presignData\.uploadUrl/);
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
  assert.match(routeSource, /GEMINI_VIDEO_API_BASE_URL \|\| process\.env\.GEMINI_API_BASE_URL/);
  assert.match(routeSource, /GEMINI_VIDEO_MODEL/);
  assert.match(routeSource, /GEMINI_VIDEO_MODEL \|\| process\.env\.GEMINI_MODEL/);
  assert.match(routeSource, /gemini-3\.5-flash/);
  assert.match(routeSource, /GEMINI_VIDEO_FALLBACK_MODEL/);
  assert.match(routeSource, /GEMINI_VIDEO_FALLBACK_MODEL \|\| process\.env\.GEMINI_FALLBACK_MODEL/);
  assert.match(routeSource, /gemini-3\.1-pro/);
  assert.match(routeSource, /FLASH_ATTEMPTS\s*=\s*3/);
  assert.match(routeSource, /for \(let attempt = 1; attempt <= FLASH_ATTEMPTS; attempt \+= 1\)/);
});

test("Gemini video route supports OpenAI-compatible video chat completions", () => {
  const routeSource = readFileSync(routeUrl, "utf8");
  assert.match(routeSource, /type GeminiVideoProtocol = "google" \| "openai"/);
  assert.match(routeSource, /GEMINI_VIDEO_API_PROTOCOL/);
  assert.match(routeSource, /buildOpenAiChatCompletionsUrl/);
  assert.match(routeSource, /chat\/completions/);
  assert.match(routeSource, /Authorization: `Bearer \$\{config\.apiKey\}`/);
  assert.match(routeSource, /type: "video_url"/);
  assert.match(routeSource, /resolveVideoUrl/);
  assert.match(routeSource, /body\.videoUrl/);
});

test("video parser deletes R2 temp object after model parsing finishes", () => {
  const routeSource = readFileSync(routeUrl, "utf8");
  assert.match(routeSource, /deleteTempR2Object/);
  assert.match(routeSource, /finally/);
});

test("video parser rejects incomplete model output instead of filling local defaults", () => {
  assert.match(pageSource, /validateVideoParseContent/);
  assert.doesNotMatch(pageSource, /content\.visualHook \|\| "指着镜头拍桌/);
  assert.doesNotMatch(pageSource, /content\.content \|\| `别再自嗨了/);
});

test("R2 upload route stores browser uploads server-side instead of returning browser PUT URLs", () => {
  const uploadRouteUrl = new URL("../../r2/video-upload/route.ts", import.meta.url);
  assert.equal(existsSync(uploadRouteUrl), true, "R2 upload route should exist");

  const uploadRouteSource = readFileSync(uploadRouteUrl, "utf8");
  assert.match(uploadRouteSource, /request\.formData\(\)/);
  assert.match(uploadRouteSource, /uploadTempVideoToR2/);
  assert.match(uploadRouteSource, /objectKey/);
  assert.doesNotMatch(uploadRouteSource, /uploadUrl/);
});

test("R2 client avoids automatic checksum query params for browser PUT CORS", () => {
  const r2Source = readFileSync(new URL("../../../lib/server/r2.ts", import.meta.url), "utf8");
  assert.match(r2Source, /requestChecksumCalculation:\s*"WHEN_REQUIRED"/);
});
