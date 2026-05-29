import { NextResponse } from "next/server";
import { sessionErrorResponse } from "@/app/lib/server/app-session";

type VideoParseRequestBody = {
  mimeType?: string;
  base64Data?: string;
  prompt?: string;
  temperature?: number;
};

type GeminiGenerateContentResponse = {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
};

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

function getGeminiVideoConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
    baseUrl: process.env.GEMINI_VIDEO_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
    primaryModel: process.env.GEMINI_VIDEO_MODEL || "gemini-3.5-flash",
    fallbackModel: process.env.GEMINI_VIDEO_FALLBACK_MODEL || "gemini-3.1-pro",
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

async function callGeminiVideo(body: Required<VideoParseRequestBody>, model: string) {
  const config = getGeminiVideoConfig();

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
            {
              inline_data: {
                mime_type: body.mimeType,
                data: body.base64Data,
              },
            },
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

    const body = (await request.json()) as VideoParseRequestBody;
    if (!body.mimeType?.startsWith("video/") || !body.base64Data || !body.prompt) {
      return NextResponse.json(
        { success: false, error: "缺少视频 mimeType、base64Data 或 prompt 参数" },
        { status: 400 }
      );
    }

    const requestBody: Required<VideoParseRequestBody> = {
      mimeType: body.mimeType,
      base64Data: body.base64Data,
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
  }
}
