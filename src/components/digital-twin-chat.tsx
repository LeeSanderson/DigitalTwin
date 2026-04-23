"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { starterQuestions } from "@/lib/digital-twin-context";

type Message = {
  role: "assistant" | "user";
  content: string;
};

const initialMessage: Message = {
  role: "assistant",
  content:
    "Hello, I'm Lee's Digital Twin. Ask me about his career journey, leadership experience, architecture work, technical background, or the kinds of engineering challenges he enjoys solving.",
};

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-7 text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          ul: ({ children }) => <ul className="ml-5 list-disc space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="ml-5 list-decimal space-y-2">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-semibold text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">{children}</h3>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-100">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-cyan-300/50 pl-4 text-slate-200">{children}</blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-cyan-200 underline decoration-cyan-300/50 underline-offset-4 transition hover:text-cyan-100"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className);

            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-xl border border-white/10 bg-slate-950/90 px-4 py-3 font-mono text-xs text-cyan-100">
                  {children}
                </code>
              );
            }

            return (
              <code className="rounded-md bg-slate-950/80 px-1.5 py-0.5 font-mono text-xs text-cyan-100">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-3 overflow-x-auto">{children}</pre>,
          hr: () => <hr className="border-white/10" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-white/10 px-3 py-2 font-semibold text-white">{children}</th>,
          td: ({ children }) => <td className="border-b border-white/10 px-3 py-2 align-top text-slate-200">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function DigitalTwinChat() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const canSend = input.trim().length > 0 && !isLoading;
  const displayedMessages = useMemo(() => messages, [messages]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed || isLoading) {
      return;
    }

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.filter((message) => message !== initialMessage),
        }),
      });

      const data = (await response.json()) as {
        answer?: string;
        error?: string;
      };

      if (!response.ok || !data.answer) {
        throw new Error(data.error ?? "The Digital Twin could not respond right now.");
      }

      const answer = data.answer;

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "The Digital Twin could not respond right now.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
      <div className="space-y-4">
        <div className="rounded-[1.75rem] border border-cyan-400/20 bg-cyan-400/8 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-cyan-200">AI Digital Twin</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Ask about Lee&apos;s career, leadership, and technical background
          </h3>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Powered by OpenRouter using <span className="font-semibold text-white">openai/gpt-oss-120b:free</span>,
            with answers grounded in the profile information on this site.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-200">Try asking</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {starterQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => {
                  setInput(question);
                  formRef.current?.querySelector("textarea")?.focus();
                }}
                className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-left text-sm text-slate-100 transition hover:border-cyan-300/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[1.9rem] border border-white/10 bg-slate-950/60 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.45)] md:p-5">
        <div
          className="flex max-h-[36rem] min-h-[30rem] flex-col gap-4 overflow-y-auto rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-4"
          aria-live="polite"
        >
          {displayedMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 text-sm leading-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
                message.role === "assistant"
                  ? "self-start border border-white/10 bg-white/6 text-slate-100"
                  : "self-end border border-cyan-400/20 bg-cyan-400/12 text-cyan-50"
              }`}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                {message.role === "assistant" ? "Digital Twin" : "You"}
              </p>
              {message.role === "assistant" ? (
                <MarkdownMessage content={message.content} />
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          ))}

          {isLoading ? (
            <div className="max-w-[85%] self-start rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4 text-sm text-slate-200">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Digital Twin</p>
              Thinking...
            </div>
          ) : null}
        </div>

        <form
          ref={formRef}
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await sendMessage(input);
          }}
        >
          <label htmlFor="digital-twin-message" className="text-sm font-medium text-slate-100">
            Ask a question
          </label>
          <textarea
            id="digital-twin-message"
            name="digital-twin-message"
            rows={4}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="For example: What kinds of architecture leadership roles has Lee held?"
            className="w-full rounded-[1.4rem] border border-white/12 bg-slate-950/80 px-4 py-3 text-base text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
          />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-300">
              Responses are based on the profile content available on this site and may avoid inventing unsupported details.
            </p>
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100"
            >
              {isLoading ? "Thinking..." : "Send question"}
            </button>
          </div>

          {error ? (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
