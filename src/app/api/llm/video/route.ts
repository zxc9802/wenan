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

type VideoProvider = "gemini" | "doubao";
type GeminiVideoProtocol = "google" | "openai";
type VideoProviderConfig = {
  provider: VideoProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  protocol: GeminiVideoProtocol;
};
type VideoParseConfig = {
  primary: VideoProviderConfig;
  fallback: VideoProviderConfig;
};
type VideoParseJobStatus = "queued" | "running" | "succeeded" | "failed";
type VideoParseAttempt = {
  provider: VideoProvider;
  model: string;
  attempt: number;
  status?: number;
  error: string;
  detail?: unknown;
};
type VideoParseCompletionPayload = {
  choices: { message: { content: string } }[];
  _provider: VideoProvider;
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

const PRIMARY_VIDEO_ATTEMPTS = 5;
const GEMINI_VIDEO_TIMEOUT_MS = Number.parseInt(process.env.GEMINI_VIDEO_TIMEOUT_MS || "300000", 10) || 300000;
const VIDEO_PARSE_JOB_TTL_MS = 30 * 60 * 1000;
const MAX_VIDEO_PARSE_JOBS = 50;
const videoParseJobs = ((globalThis as typeof globalThis & { __copywritingVideoParseJobs?: Map<string, VideoParseJob> }).__copywritingVideoParseJobs ||= new Map<string, VideoParseJob>());

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

function getVideoParseConfig(): VideoParseConfig {
  const geminiBaseUrl = process.env.GEMINI_VIDEO_API_BASE_URL || process.env.GEMINI_API_BASE_URL || "https://yunwu.ai/v1";
  const doubaoBaseUrl = process.env.DOUBAO_VIDEO_API_BASE_URL || process.env.DOUBAO_API_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";

  return {
    primary: {
      provider: "gemini",
      apiKey: process.env.GEMINI_VIDEO_API_KEY || process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
      baseUrl: geminiBaseUrl,
      model: process.env.GEMINI_VIDEO_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash",
      protocol: (process.env.GEMINI_VIDEO_API_PROTOCOL as GeminiVideoProtocol | undefined) || inferGeminiVideoProtocol(geminiBaseUrl),
    },
    fallback: {
      provider: "doubao",
      apiKey: process.env.DOUBAO_VIDEO_API_KEY || process.env.DOUBAO_API_KEY || "",
      baseUrl: doubaoBaseUrl,
      model: process.env.DOUBAO_VIDEO_MODEL || process.env.DOUBAO_MODEL || "doubao-seed-2-1-pro-260628",
      protocol: (process.env.DOUBAO_VIDEO_API_PROTOCOL as GeminiVideoProtocol | undefined) || "openai",
    },
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

function withOriginalVideoInlineData(body: ResolvedVideoParseRequestBody): ResolvedVideoParseRequestBody {
  if (!body.videoBuffer) {
    return body;
  }

  return {
    mimeType: body.mimeType,
    base64Data: body.videoBuffer.toString("base64"),
    videoUrl: body.videoUrl,
    prompt: body.prompt,
    temperature: body.temperature,
  };
}

async function fetchWithVideoTimeout(url: string, init: RequestInit, model: string) {
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

async function callGoogleGeminiVideo(body: ResolvedVideoParseRequestBody, config: VideoProviderConfig) {
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

  const upstream = await fetchWithVideoTimeout(buildGenerateContentUrl(config.baseUrl, config.model), {
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
  }, config.model);

  const data = await upstream.json().catch(async () => ({ raw: await upstream.text().catch(() => "") }));
  if (!upstream.ok) {
    const error = new Error(`${config.model} 视频解析调用失败`);
    Object.assign(error, { status: upstream.status, detail: data });
    throw error;
  }

  const content = readGeminiText(data as GeminiGenerateContentResponse);
  if (!content.trim()) {
    const error = new Error(`${config.model} 未返回可解析内容`);
    Object.assign(error, { status: 502, detail: data });
    throw error;
  }

  return content;
}

async function callOpenAiCompatibleVideo(body: ResolvedVideoParseRequestBody, config: VideoProviderConfig) {
  const videoUrl = await resolveVideoUrl(body);

  const upstream = await fetchWithVideoTimeout(buildOpenAiChatCompletionsUrl(config.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
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
  }, config.model);

  const data = await upstream.json().catch(async () => ({ raw: await upstream.text().catch(() => "") }));
  if (!upstream.ok) {
    const error = new Error(`${config.model} OpenAI 兼容视频解析调用失败`);
    Object.assign(error, { status: upstream.status, detail: data });
    throw error;
  }

  const content = (data as OpenAiChatCompletionResponse).choices?.[0]?.message?.content || "";
  if (!content.trim()) {
    const error = new Error(`${config.model} 未返回可解析内容`);
    Object.assign(error, { status: 502, detail: data });
    throw error;
  }

  return content;
}

async function callVideoProvider(body: ResolvedVideoParseRequestBody, config: VideoProviderConfig) {
  if (!config.apiKey) {
    throw createHttpError(`${config.provider} 视频解析未配置 API Key`, 500);
  }

  return config.protocol === "openai"
    ? callOpenAiCompatibleVideo(body, config)
    : callGoogleGeminiVideo(body, config);
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

async function runVideoParse(
  requestBody: ResolvedVideoParseRequestBody,
  config: VideoParseConfig,
  onAttemptsChange?: (attempts: VideoParseAttempt[]) => void
): Promise<VideoParseCompletionPayload> {
  const attempts: VideoParseAttempt[] = [];
  const recordAttempt = (attempt: VideoParseAttempt) => {
    attempts.push(attempt);
    onAttemptsChange?.([...attempts]);
  };

  for (let attempt = 1; attempt <= PRIMARY_VIDEO_ATTEMPTS; attempt += 1) {
    try {
      const content = await callVideoProvider(requestBody, config.primary);
      return {
        choices: [{ message: { content } }],
        _provider: config.primary.provider,
        _model: config.primary.model,
        _fallbackUsed: attempts.length > 0,
        _attempts: attempts,
      };
    } catch (error) {
      recordAttempt({
        provider: config.primary.provider,
        model: config.primary.model,
        attempt,
        status: errorStatus(error),
        error: error instanceof Error ? error.message : String(error),
        detail: errorDetail(error),
      });
    }
  }

  try {
    const content = await callVideoProvider(requestBody, config.fallback);
    return {
      choices: [{ message: { content } }],
      _provider: config.fallback.provider,
      _model: config.fallback.model,
      _fallbackUsed: true,
      _attempts: attempts,
    };
  } catch (error) {
    recordAttempt({
      provider: config.fallback.provider,
      model: config.fallback.model,
      attempt: 1,
      status: errorStatus(error),
      error: error instanceof Error ? error.message : String(error),
      detail: errorDetail(error),
    });
  }

  throw createHttpError(
    "视频解析失败，云雾 Gemini 重试 5 次且豆包备用模型也未能接管",
    attempts.find((attempt) => attempt.status && attempt.status >= 500)?.status || 500,
    { attempts }
  );
}

async function processVideoParseJob(
  jobId: string,
  requestBody: ResolvedVideoParseRequestBody,
  config: VideoParseConfig
) {
  updateVideoParseJob(jobId, { status: "running" });

  try {
    const inlineRequestBody = withOriginalVideoInlineData(requestBody);
    const result = await runVideoParse(inlineRequestBody, config, (attempts) => {
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

    const config = getVideoParseConfig();
    if (!config.primary.apiKey && !config.fallback.apiKey) {
      return NextResponse.json(
        { success: false, error: "视频解析未配置 API Key" },
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
