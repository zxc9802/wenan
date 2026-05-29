import { NextResponse } from "next/server";
import { sessionErrorResponse } from "@/app/lib/server/app-session";
import { createPresignedR2ReadUrl, deleteTempR2Object } from "@/app/lib/server/r2";

type VideoParseRequestBody = {
  mimeType?: string;
  base64Data?: string;
  videoUrl?: string;
  objectKey?: string;
  prompt?: string;
  temperature?: number;
};

type ResolvedVideoParseRequestBody = {
  mimeType: string;
  base64Data?: string;
  videoUrl?: string;
  objectKey?: string;
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

const FLASH_ATTEMPTS = 3;

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

async function resolveVideoUrl(body: ResolvedVideoParseRequestBody) {
  if (body.objectKey) {
    return createPresignedR2ReadUrl(body.objectKey);
  }

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

  const upstream = await fetch(buildGenerateContentUrl(config.baseUrl, model), {
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
  });

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

  const upstream = await fetch(buildOpenAiChatCompletionsUrl(config.baseUrl), {
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
  });

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

export async function POST(request: Request) {
  let cleanupObjectKey = "";

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

    const body = (await request.json()) as VideoParseRequestBody;
    cleanupObjectKey = body.objectKey || "";

    if (!body.mimeType?.startsWith("video/") || !body.prompt || (!body.base64Data && !body.videoUrl && !body.objectKey)) {
      return NextResponse.json(
        { success: false, error: "缺少视频 mimeType、视频数据或 prompt 参数" },
        { status: 400 }
      );
    }

    const requestBody: ResolvedVideoParseRequestBody = {
      mimeType: body.mimeType,
      base64Data: body.base64Data,
      videoUrl: body.videoUrl,
      objectKey: body.objectKey,
      prompt: body.prompt,
      temperature: body.temperature ?? 0.7,
    };
    const attempts = [];

    for (let attempt = 1; attempt <= FLASH_ATTEMPTS; attempt += 1) {
      try {
        const content = await callGeminiVideo(requestBody, config.primaryModel);
        return NextResponse.json({
          choices: [{ message: { content } }],
          _provider: "gemini",
          _model: config.primaryModel,
          _fallbackUsed: attempts.length > 0,
          _attempts: attempts,
        });
      } catch (error) {
        attempts.push({
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
      return NextResponse.json({
        choices: [{ message: { content } }],
        _provider: "gemini",
        _model: config.fallbackModel,
        _fallbackUsed: true,
        _attempts: attempts,
      });
    } catch (error) {
      attempts.push({
        provider: "gemini",
        model: config.fallbackModel,
        attempt: 1,
        status: errorStatus(error),
        error: error instanceof Error ? error.message : String(error),
        detail: errorDetail(error),
      });
    }

    return NextResponse.json(
      { success: false, error: "Gemini 视频解析失败，flash 重试 3 次且 pro 备用模型也未能接管", attempts },
      { status: attempts.find((attempt) => attempt.status && attempt.status >= 500)?.status || 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    if (cleanupObjectKey) {
      await deleteTempR2Object(cleanupObjectKey).catch((error) => {
        console.warn("[r2-video-cleanup] 删除临时视频失败", error);
      });
    }
  }
}
