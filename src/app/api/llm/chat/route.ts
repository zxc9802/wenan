import { NextResponse } from "next/server";
import { sessionErrorResponse } from "@/app/lib/server/app-session";

type LlmProvider = "gemini" | "deepseek";

type ChatRequestBody = {
  messages?: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  response_format?: { type: string };
  preferredProvider?: LlmProvider;
  fallbackProvider?: LlmProvider;
};

function cleanBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getProviderConfig(provider: LlmProvider) {
  if (provider === "gemini") {
    return {
      provider,
      apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
      baseUrl: cleanBaseUrl(process.env.GEMINI_API_BASE_URL || process.env.LLM_API_BASE_URL || process.env.OPENAI_BASE_URL || "https://ai.shanbaob.net/v1"),
      model: process.env.GEMINI_MODEL || process.env.LLM_MODEL || process.env.OPENAI_MODEL || "gemini-3.1-pro-preview",
    };
  }

  return {
    provider,
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
    baseUrl: cleanBaseUrl(process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com/v1"),
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
  };
}

function getProviderOrder(preferredProvider?: LlmProvider, fallbackProvider?: LlmProvider) {
  const preferred = preferredProvider || ((process.env.DEFAULT_LLM_PROVIDER as LlmProvider | undefined) || "gemini");
  const fallback = fallbackProvider || (preferred === "gemini" ? "deepseek" : "gemini");
  return Array.from(new Set([preferred, fallback].filter((provider): provider is LlmProvider => provider === "gemini" || provider === "deepseek")));
}

async function callChatCompletion(provider: LlmProvider, body: ChatRequestBody) {
  const config = getProviderConfig(provider);
  if (!config.apiKey) {
    throw new Error(`${provider} 未配置 API Key`);
  }

  const upstream = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      ...(provider === "deepseek" ? {
        thinking: { type: "enabled" },
        reasoning_effort: "high",
        stream: false,
      } : {}),
      ...(body.response_format ? { response_format: body.response_format } : {}),
    }),
  });

  const data = await upstream.json().catch(async () => ({ raw: await upstream.text().catch(() => "") }));
  if (!upstream.ok) {
    const error = new Error(`${provider} 调用失败`);
    Object.assign(error, { status: upstream.status, detail: data });
    throw error;
  }

  return { data, provider };
}

export async function POST(request: Request) {
  try {
    const sessionError = await sessionErrorResponse(request);
    if (sessionError) return sessionError;

    const body = (await request.json()) as ChatRequestBody;
    if (!body.messages?.length) {
      return NextResponse.json(
        { success: false, error: "缺少 messages 参数" },
        { status: 400 }
      );
    }

    const attempts = [];
    for (const provider of getProviderOrder(body.preferredProvider, body.fallbackProvider)) {
      try {
        const { data, provider: usedProvider } = await callChatCompletion(provider, body);
        return NextResponse.json({
          ...data,
          _provider: usedProvider,
          _fallbackUsed: usedProvider !== body.preferredProvider,
          _attempts: attempts,
        });
      } catch (error) {
        attempts.push({
          provider,
          status: typeof error === "object" && error && "status" in error ? (error as { status?: number }).status : 500,
          error: error instanceof Error ? error.message : String(error),
          detail: typeof error === "object" && error && "detail" in error ? (error as { detail?: unknown }).detail : undefined,
        });
      }
    }

    return NextResponse.json(
      { success: false, error: "大模型服务端调用失败，备用模型也未能接管", attempts },
      { status: attempts.find((attempt) => attempt.status && attempt.status >= 500)?.status || 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
