import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { NextResponse } from "next/server";
import { sessionErrorResponse } from "@/app/lib/server/app-session";

export const runtime = "nodejs";
export const maxDuration = 300;

type VideoParseRequestBody = {
  mimeType?: string;
  base64Data?: string;
  videoUrl?: string;
  prompt?: string;
  temperature?: number;
};

type ResolvedVideoParseRequestBody = {
  mimeType: string;
  base64Data?: string;
  videoBuffer?: Buffer;
  videoUrl?: string;
  prompt: string;
  temperature: number;
};

type GeminiGenerateContentResponse = {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
};

type OpenAiChatCompletionResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
};

type GeminiVideoProtocol = "google" | "openai";
type VideoParseJobStatus = "queued" | "running" | "succeeded" | "failed";
type VideoParseAttempt = {
  provider: "gemini";
  model: string;
  attempt: number;
  status?: number;
  error: string;
  detail?: unknown;
};
type VideoParseCompletionPayload = {
  choices: { message: { content: string } }[];
  _provider: "gemini";
  _model: string;
  _fallbackUsed: boolean;
  _attempts: VideoParseAttempt[];
};
type VideoParseJob = {
  status: VideoParseJobStatus;
  createdAt: number;
  updatedAt: number;
  attempts: VideoParseAttempt[];
  result?: VideoParseCompletionPayload;
  error?: string;
  detail?: unknown;
};

const FLASH_ATTEMPTS = 3;
const GEMINI_VIDEO_TIMEOUT_MS = Number.parseInt(process.env.GEMINI_VIDEO_TIMEOUT_MS || "300000", 10) || 300000;
const TARGET_VIDEO_INLINE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_INLINE_BYTES = 14 * 1024 * 1024;
const VIDEO_TRANSCODE_TIMEOUT_MS = Number.parseInt(process.env.VIDEO_TRANSCODE_TIMEOUT_MS || "240000", 10) || 240000;
const VIDEO_PARSE_JOB_TTL_MS = 30 * 60 * 1000;
const MAX_VIDEO_PARSE_JOBS = 50;
const videoParseJobs = ((globalThis as typeof globalThis & { __copywritingVideoParseJobs?: Map<string, VideoParseJob> }).__copywritingVideoParseJobs ||= new Map<string, VideoParseJob>());
const bundledFfmpegPath = process.platform === "win32"
  ? "node_modules\\ffmpeg-static\\ffmpeg.exe"
  : "node_modules/ffmpeg-static/ffmpeg";

function cleanBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function buildGenerateContentUrl(baseUrl: string, model: string) {
  let normalized = cleanBaseUrl(baseUrl).replace(/\/openai\/?$/, "");
  const modelPath = `/models/${encodeURIComponent(model)}:generateContent`;

  if (/\/models\/[^/]+:generateContent(?:\?|$)/.test(normalized)) {
    return normalized.replace(/\/models\/[^/]+:generateContent/, modelPath);
  }

  if (/\/models\/[^/]+$/.test(normalized)) {
    return normalized.replace(/\/models\/[^/]+$/, modelPath);
  }

  if (!/\/v\d+(?:beta|alpha)?$/.test(normalized)) {
    normalized = `${normalized}/v1beta`;
  }

  return `${normalized}/models/${encodeURIComponent(model)}:generateContent`;
}

function buildOpenAiChatCompletionsUrl(baseUrl: string) {
  const normalized = cleanBaseUrl(baseUrl);
  return /\/chat\/completions$/.test(normalized) ? normalized : `${normalized}/chat/completions`;
}

function inferGeminiVideoProtocol(baseUrl: string): GeminiVideoProtocol {
  const normalized = baseUrl.toLowerCase();
  if (normalized.includes("shanbaob.net")) {
    return "google";
  }

  if (normalized.includes("generativelanguage.googleapis.com") && !normalized.includes("/openai")) {
    return "google";
  }

  return "openai";
}

function getGeminiVideoConfig() {
  const baseUrl = process.env.GEMINI_VIDEO_API_BASE_URL || process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";

  return {
    apiKey: process.env.GEMINI_VIDEO_API_KEY || process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
    baseUrl,
    primaryModel: process.env.GEMINI_VIDEO_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash",
    fallbackModel: process.env.GEMINI_VIDEO_FALLBACK_MODEL || process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-pro",
    protocol: (process.env.GEMINI_VIDEO_API_PROTOCOL as GeminiVideoProtocol | undefined) || inferGeminiVideoProtocol(baseUrl),
  };
}

function readGeminiText(data: GeminiGenerateContentResponse) {
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
}

function errorStatus(error: unknown) {
  return typeof error === "object" && error && "status" in error ? (error as { status?: number }).status : 500;
}

function errorDetail(error: unknown) {
  return typeof error === "object" && error && "detail" in error ? (error as { detail?: unknown }).detail : undefined;
}

function createHttpError(message: string, status: number, detail?: unknown) {
  const error = new Error(message);
  Object.assign(error, { status, detail });
  return error;
}

function parseTemperature(value: FormDataEntryValue | number | undefined) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;
  return Number.isFinite(numericValue) ? numericValue : 0.7;
}

async function parseMultipartVideoRequest(request: Request): Promise<ResolvedVideoParseRequestBody> {
  const formData = await request.formData();
  const file = formData.get("file");
  const promptValue = formData.get("prompt");
  const mimeTypeValue = formData.get("mimeType");

  if (!(file instanceof File)) {
    throw createHttpError("缺少视频文件，请重新上传后再解析", 400);
  }

  const prompt = typeof promptValue === "string" ? promptValue.trim() : "";
  const mimeType =
    typeof mimeTypeValue === "string" && mimeTypeValue.trim()
      ? mimeTypeValue.trim()
      : file.type || "video/mp4";

  if (!mimeType.startsWith("video/") || !prompt) {
    throw createHttpError("缺少视频 mimeType 或 prompt 参数", 400);
  }

  const videoBuffer = Buffer.from(await file.arrayBuffer());
  if (!videoBuffer.byteLength) {
    throw createHttpError("视频文件为空，请重新上传", 400);
  }

  return {
    mimeType,
    videoBuffer,
    prompt,
    temperature: parseTemperature(formData.get("temperature") || undefined),
  };
}

async function parseJsonVideoRequest(request: Request): Promise<ResolvedVideoParseRequestBody> {
  const body = (await request.json()) as VideoParseRequestBody;
  const mimeType = body.mimeType?.trim() || "";
  const prompt = body.prompt?.trim() || "";

  if (!mimeType.startsWith("video/") || !prompt || (!body.base64Data && !body.videoUrl)) {
    throw createHttpError("缺少视频 mimeType、视频数据或 prompt 参数", 400);
  }

  return {
    mimeType,
    base64Data: body.base64Data,
    videoUrl: body.videoUrl,
    prompt,
    temperature: parseTemperature(body.temperature),
  };
}

async function parseVideoRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return parseMultipartVideoRequest(request);
  }

  return parseJsonVideoRequest(request);
}

type FfmpegResult = {
  stdout: string;
  stderr: string;
};

function getFfmpegPath() {
  return process.env.FFMPEG_PATH || bundledFfmpegPath || "ffmpeg";
}

function runFfmpeg(args: string[], options: { timeoutMs?: number; allowFailure?: boolean } = {}): Promise<FfmpegResult> {
  const timeoutMs = options.timeoutMs || VIDEO_TRANSCODE_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const child = spawn(getFfmpegPath(), args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(createHttpError("服务端视频压缩超时，请上传更短的视频", 504));
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(createHttpError("服务端视频压缩组件不可用", 500, { message: error.message }));
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0 || options.allowFailure) {
        resolve({ stdout, stderr });
        return;
      }
      reject(createHttpError("服务端视频压缩失败", 500, { code, stderr: stderr.slice(-2000) }));
    });
  });
}

function parseFfmpegDuration(stderr: string) {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const seconds = Number.parseFloat(match[3] || "0");
  const duration = hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(duration) ? duration : 0;
}

async function probeVideoDuration(inputPath: string) {
  const result = await runFfmpeg(["-hide_banner", "-i", inputPath], {
    timeoutMs: 30000,
    allowFailure: true,
  });
  return parseFfmpegDuration(result.stderr);
}

function calculateVideoBitrateKbps(durationSeconds: number) {
  if (!durationSeconds || durationSeconds <= 0) return 420;
  const targetTotalKbps = Math.floor((TARGET_VIDEO_INLINE_BYTES * 8 * 0.9) / durationSeconds / 1000);
  return Math.min(650, Math.max(120, targetTotalKbps - 48));
}

async function compressVideoForGeminiInlineData(videoBuffer: Buffer, mimeType: string) {
  if (videoBuffer.byteLength <= TARGET_VIDEO_INLINE_BYTES) {
    return { buffer: videoBuffer, mimeType };
  }

  const tempDir = await mkdtemp(`${tmpdir()}/copywriting-video-`);
  const inputPath = `${tempDir}/input-video`;
  const outputPath = `${tempDir}/output.mp4`;

  try {
    await writeFile(inputPath, videoBuffer);
    const durationSeconds = await probeVideoDuration(inputPath);
    const videoBitrateKbps = calculateVideoBitrateKbps(durationSeconds);

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-vf",
      "scale=-2:360,fps=15",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-b:v",
      `${videoBitrateKbps}k`,
      "-maxrate",
      `${Math.round(videoBitrateKbps * 1.25)}k`,
      "-bufsize",
      `${Math.round(videoBitrateKbps * 2)}k`,
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "48k",
      "-ac",
      "1",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    const compressedBuffer = await readFile(outputPath);
    const bestBuffer = compressedBuffer.byteLength < videoBuffer.byteLength ? compressedBuffer : videoBuffer;
    if (bestBuffer.byteLength > MAX_VIDEO_INLINE_BYTES) {
      throw createHttpError("视频压缩后仍超过 Gemini inline_data 稳定上限，请上传更短的视频", 413, {
        originalBytes: videoBuffer.byteLength,
        compressedBytes: compressedBuffer.byteLength,
        maxBytes: MAX_VIDEO_INLINE_BYTES,
      });
    }

    return { buffer: bestBuffer, mimeType: bestBuffer === compressedBuffer ? "video/mp4" : mimeType };
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function prepareVideoForGeminiInlineData(body: ResolvedVideoParseRequestBody): Promise<ResolvedVideoParseRequestBody> {
  if (!body.videoBuffer) {
    return body;
  }

  const preparedVideo = await compressVideoForGeminiInlineData(body.videoBuffer, body.mimeType);
  return {
    mimeType: preparedVideo.mimeType,
    base64Data: preparedVideo.buffer.toString("base64"),
    videoUrl: body.videoUrl,
    prompt: body.prompt,
    temperature: body.temperature,
  };
}

async function fetchWithGeminiTimeout(url: string, init: RequestInit, model: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_VIDEO_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createHttpError(`${model} 视频解析超时，请压缩视频或稍后重试`, 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveVideoUrl(body: ResolvedVideoParseRequestBody) {
  if (body.videoUrl) {
    if (!/^https:\/\//i.test(body.videoUrl)) {
      throw new Error("视频 URL 必须是 HTTPS 地址");
    }
    return body.videoUrl;
  }

  if (body.base64Data) {
    return `data:${body.mimeType};base64,${body.base64Data}`;
  }

  throw new Error("缺少可供模型读取的视频数据");
}

async function callGoogleGeminiVideo(body: ResolvedVideoParseRequestBody, model: string, config: ReturnType<typeof getGeminiVideoConfig>) {
  const videoPart = body.base64Data
    ? {
        inline_data: {
          mime_type: body.mimeType,
          data: body.base64Data,
        },
      }
    : {
        file_data: {
          mime_type: body.mimeType,
          file_uri: await resolveVideoUrl(body),
        },
      };

  const upstream = await fetchWithGeminiTimeout(buildGenerateContentUrl(config.baseUrl, model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": config.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            videoPart,
            {
              text: body.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: body.temperature,
        responseMimeType: "application/json",
      },
    }),
  }, model);

  const data = await upstream.json().catch(async () => ({ raw: await upstream.text().catch(() => "") }));
  if (!upstream.ok) {
    const error = new Error(`${model} 视频解析调用失败`);
    Object.assign(error, { status: upstream.status, detail: data });
    throw error;
  }

  const content = readGeminiText(data as GeminiGenerateContentResponse);
  if (!content.trim()) {
    const error = new Error(`${model} 未返回可解析内容`);
    Object.assign(error, { status: 502, detail: data });
    throw error;
  }

  return content;
}

async function callOpenAiCompatibleVideo(body: ResolvedVideoParseRequestBody, model: string, config: ReturnType<typeof getGeminiVideoConfig>) {
  const videoUrl = await resolveVideoUrl(body);

  const upstream = await fetchWithGeminiTimeout(buildOpenAiChatCompletionsUrl(config.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: body.prompt,
            },
            {
              type: "video_url",
              video_url: {
                url: videoUrl,
              },
            },
          ],
        },
      ],
      temperature: body.temperature,
      response_format: { type: "json_object" },
    }),
  }, model);

  const data = await upstream.json().catch(async () => ({ raw: await upstream.text().catch(() => "") }));
  if (!upstream.ok) {
    const error = new Error(`${model} OpenAI 兼容视频解析调用失败`);
    Object.assign(error, { status: upstream.status, detail: data });
    throw error;
  }

  const content = (data as OpenAiChatCompletionResponse).choices?.[0]?.message?.content || "";
  if (!content.trim()) {
    const error = new Error(`${model} 未返回可解析内容`);
    Object.assign(error, { status: 502, detail: data });
    throw error;
  }

  return content;
}

async function callGeminiVideo(body: ResolvedVideoParseRequestBody, model: string) {
  const config = getGeminiVideoConfig();
  return config.protocol === "openai"
    ? callOpenAiCompatibleVideo(body, model, config)
    : callGoogleGeminiVideo(body, model, config);
}

function cleanupExpiredVideoParseJobs() {
  const now = Date.now();
  for (const [jobId, job] of videoParseJobs.entries()) {
    if (now - job.updatedAt > VIDEO_PARSE_JOB_TTL_MS) {
      videoParseJobs.delete(jobId);
    }
  }

  if (videoParseJobs.size <= MAX_VIDEO_PARSE_JOBS) return;

  const sortedJobs = [...videoParseJobs.entries()].sort(([, left], [, right]) => left.updatedAt - right.updatedAt);
  for (const [jobId] of sortedJobs.slice(0, videoParseJobs.size - MAX_VIDEO_PARSE_JOBS)) {
    videoParseJobs.delete(jobId);
  }
}

function updateVideoParseJob(jobId: string, patch: Partial<VideoParseJob>) {
  const job = videoParseJobs.get(jobId);
  if (!job) return;
  videoParseJobs.set(jobId, {
    ...job,
    ...patch,
    updatedAt: Date.now(),
  });
}

function serializeVideoParseJob(jobId: string, job: VideoParseJob) {
  if (job.status === "succeeded" && job.result) {
    return {
      success: true,
      jobId,
      status: job.status,
      ...job.result,
    };
  }

  return {
    success: job.status !== "failed",
    jobId,
    status: job.status,
    attempts: job.attempts,
    error: job.error,
    detail: job.detail,
  };
}

async function runGeminiVideoParse(
  requestBody: ResolvedVideoParseRequestBody,
  config: ReturnType<typeof getGeminiVideoConfig>,
  onAttemptsChange?: (attempts: VideoParseAttempt[]) => void
): Promise<VideoParseCompletionPayload> {
  const attempts: VideoParseAttempt[] = [];
  const recordAttempt = (attempt: VideoParseAttempt) => {
    attempts.push(attempt);
    onAttemptsChange?.([...attempts]);
  };

  for (let attempt = 1; attempt <= FLASH_ATTEMPTS; attempt += 1) {
    try {
      const content = await callGeminiVideo(requestBody, config.primaryModel);
      return {
        choices: [{ message: { content } }],
        _provider: "gemini",
        _model: config.primaryModel,
        _fallbackUsed: attempts.length > 0,
        _attempts: attempts,
      };
    } catch (error) {
      recordAttempt({
        provider: "gemini",
        model: config.primaryModel,
        attempt,
        status: errorStatus(error),
        error: error instanceof Error ? error.message : String(error),
        detail: errorDetail(error),
      });
    }
  }

  try {
    const content = await callGeminiVideo(requestBody, config.fallbackModel);
    return {
      choices: [{ message: { content } }],
      _provider: "gemini",
      _model: config.fallbackModel,
      _fallbackUsed: true,
      _attempts: attempts,
    };
  } catch (error) {
    recordAttempt({
      provider: "gemini",
      model: config.fallbackModel,
      attempt: 1,
      status: errorStatus(error),
      error: error instanceof Error ? error.message : String(error),
      detail: errorDetail(error),
    });
  }

  throw createHttpError(
    "Gemini 视频解析失败，flash 重试 3 次且 pro 备用模型也未能接管",
    attempts.find((attempt) => attempt.status && attempt.status >= 500)?.status || 500,
    { attempts }
  );
}

async function processVideoParseJob(
  jobId: string,
  requestBody: ResolvedVideoParseRequestBody,
  config: ReturnType<typeof getGeminiVideoConfig>
) {
  updateVideoParseJob(jobId, { status: "running" });

  try {
    const preparedRequestBody = await prepareVideoForGeminiInlineData(requestBody);
    const result = await runGeminiVideoParse(preparedRequestBody, config, (attempts) => {
      updateVideoParseJob(jobId, { attempts });
    });
    updateVideoParseJob(jobId, { status: "succeeded", result, attempts: result._attempts });
  } catch (error) {
    const detail = errorDetail(error);
    const attempts = typeof detail === "object" && detail && "attempts" in detail
      ? (detail as { attempts?: VideoParseAttempt[] }).attempts || []
      : videoParseJobs.get(jobId)?.attempts || [];

    updateVideoParseJob(jobId, {
      status: "failed",
      attempts,
      error: error instanceof Error ? error.message : String(error),
      detail,
    });
  }
}

export async function GET(request: Request) {
  try {
    const sessionError = await sessionErrorResponse(request);
    if (sessionError) return sessionError;

    cleanupExpiredVideoParseJobs();
    const jobId = new URL(request.url).searchParams.get("jobId")?.trim() || "";
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "缺少视频解析任务 jobId" },
        { status: 400 }
      );
    }

    const job = videoParseJobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "视频解析任务不存在或已过期" },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeVideoParseJob(jobId, job));
  } catch (error) {
    const status = errorStatus(error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error), detail: errorDetail(error) },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionError = await sessionErrorResponse(request);
    if (sessionError) return sessionError;

    const config = getGeminiVideoConfig();
    if (!config.apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini 视频解析未配置 API Key" },
        { status: 500 }
      );
    }

    const requestBody = await parseVideoRequest(request);
    cleanupExpiredVideoParseJobs();
    const jobId = crypto.randomUUID();
    videoParseJobs.set(jobId, {
      status: "queued",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attempts: [],
    });
    void processVideoParseJob(jobId, requestBody, config);

    return NextResponse.json(
      { success: true, jobId, status: "queued" },
      { status: 202 }
    );
  } catch (error) {
    const status = errorStatus(error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error), detail: errorDetail(error) },
      { status }
    );
  }
}
