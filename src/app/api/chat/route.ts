import { NextResponse } from "next/server";

import {
  digitalTwinContext,
  digitalTwinSystemPrompt,
} from "@/lib/digital-twin-context";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const MODEL_NAME = "openai/gpt-oss-120b:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const runtime = "nodejs";

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== "object") {
        return false;
      }

      const candidate = message as Partial<ChatMessage>;
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string"
      );
    })
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 4000),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-10);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as { messages?: unknown };
    const messages = sanitizeMessages(body.messages);

    if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
      return NextResponse.json(
        { error: "Please provide at least one user message." },
        { status: 400 },
      );
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Digital Twin Website",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: digitalTwinSystemPrompt,
          },
          {
            role: "system",
            content: `Profile context:\n${digitalTwinContext}`,
          },
          ...messages,
        ],
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ??
            "OpenRouter returned an error while generating a response.",
        },
        { status: response.status },
      );
    }

    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: "The model returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      answer,
      model: MODEL_NAME,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while processing the chat request." },
      { status: 500 },
    );
  }
}
