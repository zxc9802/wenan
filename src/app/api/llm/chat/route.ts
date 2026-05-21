import { NextResponse } from "next/server";
import { sessionErrorResponse } from "@/app/lib/server/app-session";

type ChatRequestBody = {
  messages?: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  response_format?: { type: string };
};

function cleanBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export async function POST(request: Request) {
  try {
    const sessionError = await sessionErrorResponse(request);
    if (sessionError) return sessionError;

    const body = (await request.json()) as ChatRequestBody;
    const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
    const baseUrl = cleanBaseUrl(process.env.LLM_API_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1");
    const model = process.env.LLM_MODEL || process.env.OPENAI_MODEL || "deepseek-chat";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "服务端未配置 LLM_API_KEY / OPENAI_API_KEY / DEEPSEEK_API_KEY" },
        { status: 500 }
      );
    }

    if (!body.messages?.length) {
      return NextResponse.json(
        { success: false, error: "缺少 messages 参数" },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        ...(body.response_format ? { response_format: body.response_format } : {}),
      }),
    });

    const data = await upstream.json().catch(async () => ({ raw: await upstream.text().catch(() => "") }));
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: "大模型服务端调用失败", detail: data },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
