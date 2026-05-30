import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const routeUrl = new URL("./route.ts", import.meta.url);
const pageSource = readFileSync(new URL("../../../page.tsx", import.meta.url), "utf8");
const packageSource = readFileSync(new URL("../../../../../package.json", import.meta.url), "utf8");

test("video parser posts uploaded local video to the server-side Gemini video route", () => {
  assert.match(pageSource, /fetch\("\/api\/llm\/video"/);
  assert.match(pageSource, /mimeType/);
  assert.match(pageSource, /FormData/);
  assert.match(pageSource, /formData\.append\("file"/);
  assert.match(pageSource, /formData\.append\("prompt"/);
  assert.match(pageSource, /formData\.append\("temperature"/);
  assert.doesNotMatch(pageSource, /fetch\("\/api\/r2\/video-upload"/);
  assert.doesNotMatch(pageSource, /presignData\.uploadUrl/);
});

test("video parser UI does not show a compression step", () => {
  assert.doesNotMatch(pageSource, /正在[^"`]*压缩|压缩中/);
});

test("video parser polls a background parse job instead of waiting on the initial request", () => {
  assert.match(pageSource, /pollVideoParseJob/);
  assert.match(pageSource, /jobId/);
  assert.match(pageSource, /status === "succeeded"/);
  assert.match(pageSource, /\/api\/llm\/video\?\$\{params\.toString\(\)\}/);
});

test("video parser asks for a verbatim transcript instead of rewritten copy", () => {
  assert.match(pageSource, /逐字转写原视频口播/);
  assert.match(pageSource, /清楚听到的原话必须逐字保留/);
  assert.match(pageSource, /听不清的小片段可以结合上下文补成自然完整句子/);
  assert.match(pageSource, /不得借补全名义总结、改写、扩写清楚听到的内容/);
  assert.doesNotMatch(pageSource, /content": "完全复原的高手原文字句[\s\S]*比如：/);
});

test("video parser uses low temperature for transcript extraction", () => {
  assert.match(pageSource, /createVideoParseFormData\(matVideoFile, uploadedVideoName \|\| "video\.mp4", prompt, 0\.1\)/);
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

test("Gemini video route accepts multipart uploads and sends native Gemini inline base64", () => {
  const routeSource = readFileSync(routeUrl, "utf8");
  assert.match(routeSource, /request\.formData\(\)/);
  assert.match(routeSource, /file\.arrayBuffer\(\)/);
  assert.match(routeSource, /base64Data/);
  assert.match(routeSource, /inline_data/);
});

test("Gemini video route sends original multipart uploads as inline base64 without compression", () => {
  const routeSource = readFileSync(routeUrl, "utf8");
  assert.match(routeSource, /videoBuffer\?: Buffer/);
  assert.match(routeSource, /base64Data: body\.videoBuffer\.toString\("base64"\)/);
  assert.doesNotMatch(packageSource, /"ffmpeg-static"/);
  assert.doesNotMatch(routeSource, /from "node:child_process"/);
  assert.doesNotMatch(routeSource, /from "node:fs\/promises"/);
  assert.doesNotMatch(routeSource, /from "node:os"/);
  assert.doesNotMatch(routeSource, /ffmpeg-static/);
  assert.doesNotMatch(routeSource, /TARGET_VIDEO_INLINE_BYTES|MAX_VIDEO_INLINE_BYTES|VIDEO_TRANSCODE_TIMEOUT_MS/);
  assert.doesNotMatch(routeSource, /compressVideoForGeminiInlineData|prepareVideoForGeminiInlineData/);
});

test("Gemini video route creates background jobs and exposes polling status", () => {
  const routeSource = readFileSync(routeUrl, "utf8");
  assert.match(routeSource, /type VideoParseJobStatus = "queued" \| "running" \| "succeeded" \| "failed"/);
  assert.match(routeSource, /const videoParseJobs =/);
  assert.match(routeSource, /processVideoParseJob/);
  assert.match(routeSource, /NextResponse\.json\(\s*\{\s*success: true,\s*jobId,\s*status: "queued"/s);
  assert.match(routeSource, /export async function GET\(request: Request\)/);
});

test("Gemini video route defaults shanbaob video calls to native Gemini protocol", () => {
  const routeSource = readFileSync(routeUrl, "utf8");
  assert.match(routeSource, /shanbaob\.net/);
  assert.match(routeSource, /return "google"/);
});

test("Gemini video route extends execution and upstream fetch timeout for base64 video parsing", () => {
  const routeSource = readFileSync(routeUrl, "utf8");
  assert.match(routeSource, /export const maxDuration\s*=\s*300/);
  assert.match(routeSource, /GEMINI_VIDEO_TIMEOUT_MS\s*=/);
  assert.match(routeSource, /AbortController/);
  assert.match(routeSource, /signal: controller\.signal/);
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
