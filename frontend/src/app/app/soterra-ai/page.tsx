"use client";

import type { FormEvent, MutableRefObject, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CpuChipIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "@/lib/classNames";
import type { SoterraMetricRoute } from "@/lib/soterraAiMetricRoutes";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  routes?: AgentRouteCitation[];
  state?: "ready" | "error";
};

type AgentRouteCitation = {
  id: string;
  name: string;
  frontendPath: string;
  backendPath: string;
  description: string;
};

type AgentResponse = {
  answer?: string;
  routes?: AgentRouteCitation[];
};

type AgentManifest = {
  routes: SoterraMetricRoute[];
};

const examplePrompts = [
  "Urgent defects to fix",
  "Latest report summary",
] as const;

const contextChips = [
  "All reports",
  "Latest report",
  "Open defects",
  "Missing evidence",
] as const;

const extraContextChips = [
  "Failed inspections",
  "Ready for reinspection",
  "By site",
  "By subcontractor",
] as const;

const allContextChips = [...contextChips, ...extraContextChips] as const;

export default function SoterraAiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedContext, setSelectedContext] = useState("All reports");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [manifestError, setManifestError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageIdRef = useRef(0);

  useEffect(() => {
    let active = true;

    fetch("/api/soterra-ai/metrics", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Soterra AI tools are unavailable.");
        return response.json() as Promise<AgentManifest>;
      })
      .then((payload) => {
        if (active && !Array.isArray(payload.routes)) {
          setManifestError("Soterra AI is not ready yet.");
        }
      })
      .catch((error) => {
        if (active) {
          setManifestError(
            error instanceof Error
              ? error.message
              : "Soterra AI tools are unavailable."
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function submitQuestion(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isThinking) return;

    const userMessage: ChatMessage = {
      id: nextMessageId(messageIdRef, "user"),
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsThinking(true);

    void answerQuestion(trimmedQuestion);
  }

  async function answerQuestion(question: string) {
    try {
      const response = await fetch("/api/soterra-ai/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context: selectedContext }),
      });
      const payload = (await response.json().catch(() => null)) as AgentResponse | null;

      if (!response.ok) {
        throw new Error(payload?.answer || "Soterra AI could not check the records.");
      }

      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(messageIdRef, "assistant"),
          role: "assistant",
          content:
            payload?.answer?.trim() ||
            "Soterra AI checked the records but did not receive a summary.",
          routes: payload?.routes ?? [],
          state: "ready",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(messageIdRef, "assistant"),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Soterra AI could not check the records.",
          state: "error",
        },
      ]);
    } finally {
      setIsThinking(false);
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuestion(input);
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] min-h-[620px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
            <CpuChipIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm/6 font-semibold text-slate-900 dark:text-white">
              Soterra Site Assistant
            </h1>
            <p className="truncate text-xs/5 text-slate-500 dark:text-slate-400">
              Find failed items, evidence gaps, and next steps
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-xs/5 text-slate-500 sm:flex dark:text-slate-400">
          {manifestError ? (
            <>
              <ExclamationCircleIcon className="size-4 text-rose-500" aria-hidden="true" />
              Not ready
            </>
          ) : (
            <>
              <CheckCircleIcon className="size-4 text-emerald-500" aria-hidden="true" />
              Ready
            </>
          )}
        </div>
      </header>

      {messages.length > 0 ? (
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-gray-900 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <ContextChips
              compact
              menuOpen={filterMenuOpen}
              selectedContext={selectedContext}
              onSelectContext={(context) => {
                setSelectedContext(context);
                setFilterMenuOpen(false);
              }}
              onToggleMenu={() => setFilterMenuOpen((open) => !open)}
            />
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        <section className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-900">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto flex min-h-full max-w-5xl flex-col">
              {messages.length === 0 ? (
                <EmptyState
                  input={input}
                  isThinking={isThinking}
                  selectedContext={selectedContext}
                  textareaRef={textareaRef}
                  disabled={isThinking}
                  onChangeInput={setInput}
                  onSelectContext={setSelectedContext}
                  onToggleFilterMenu={() => setFilterMenuOpen((open) => !open)}
                  filterMenuOpen={filterMenuOpen}
                  onSelectPrompt={submitQuestion}
                  onSubmit={handleSubmit}
                />
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <MessageBlock key={message.id} message={message} />
                  ))}

                  {isThinking ? <ThinkingBlock /> : null}
                </div>
              )}
            </div>
          </div>

          {messages.length > 0 ? (
            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-gray-900 sm:px-6">
              <div className="mx-auto max-w-3xl">
                <QuestionComposer
                  input={input}
                  isThinking={isThinking}
                  textareaRef={textareaRef}
                  onChangeInput={setInput}
                  onSubmit={handleSubmit}
                  onSubmitQuestion={submitQuestion}
                />
                <HelperText compact />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function EmptyState({
  input,
  isThinking,
  selectedContext,
  textareaRef,
  disabled,
  onChangeInput,
  onSelectContext,
  onToggleFilterMenu,
  filterMenuOpen,
  onSelectPrompt,
  onSubmit,
}: {
  input: string;
  isThinking: boolean;
  selectedContext: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
  onChangeInput: (value: string) => void;
  onSelectContext: (context: string) => void;
  onToggleFilterMenu: () => void;
  filterMenuOpen: boolean;
  onSelectPrompt: (question: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-start py-6 sm:justify-center sm:py-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm dark:bg-indigo-500">
          <SparklesIcon className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          What would you like to check in your inspection reports?
        </h2>
        <p className="mt-3 text-sm/6 text-slate-600 dark:text-slate-300">
          Ask about defects, missing evidence, and what needs fixing before reinspection.
        </p>
      </div>

      <div className="mx-auto mt-6 w-full max-w-2xl">
        <ContextChips
          menuOpen={filterMenuOpen}
          selectedContext={selectedContext}
          onSelectContext={onSelectContext}
          onToggleMenu={onToggleFilterMenu}
        />
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {examplePrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
            className="rounded-lg border border-slate-200 bg-transparent px-3.5 py-2 text-left text-sm/6 font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:border-indigo-300/30 dark:hover:bg-white/5 dark:hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-4 w-full max-w-2xl">
        <QuestionComposer
          input={input}
          isThinking={isThinking}
          textareaRef={textareaRef}
          onChangeInput={onChangeInput}
          onSubmit={onSubmit}
          onSubmitQuestion={onSelectPrompt}
        />
        <HelperText />
      </div>
    </div>
  );
}

function ContextChips({
  compact = false,
  menuOpen = false,
  selectedContext,
  onSelectContext,
  onToggleMenu,
}: {
  compact?: boolean;
  menuOpen?: boolean;
  selectedContext: string;
  onSelectContext: (context: string) => void;
  onToggleMenu?: () => void;
}) {
  if (compact) {
    return (
      <div className="relative flex flex-wrap items-center gap-2">
        <span className="text-xs/5 font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
          Filter
        </span>
        <span className="rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-300/40 dark:bg-indigo-500/15 dark:text-indigo-100">
          {selectedContext}
        </span>
        <button
          type="button"
          onClick={onToggleMenu}
          className="rounded-full border border-slate-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-white/10 dark:text-slate-400 dark:hover:border-indigo-300/30 dark:hover:text-white"
        >
          Change filter
        </button>
        {menuOpen ? (
          <div className="absolute top-10 left-0 z-10 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-gray-950">
            <div className="grid gap-1">
              {allContextChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    onSelectContext(chip);
                  }}
                  className={classNames(
                    "rounded-lg px-3 py-2 text-left text-sm/6 font-medium transition",
                    chip === selectedContext
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs/5 font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
        Filter reports
      </p>
      <div className="flex flex-wrap gap-2">
        {contextChips.map((chip) => {
          const selected = chip === selectedContext;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => onSelectContext(chip)}
              className={classNames(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                selected
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-300/40 dark:bg-indigo-500/15 dark:text-indigo-100"
                  : "border-slate-200 bg-transparent text-slate-500 hover:border-indigo-200 hover:text-indigo-700 dark:border-white/10 dark:text-slate-400 dark:hover:border-indigo-300/30 dark:hover:text-white"
              )}
            >
              {chip}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onToggleMenu}
          className="rounded-full border border-slate-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-white/10 dark:text-slate-400 dark:hover:border-indigo-300/30 dark:hover:text-white"
        >
          More
        </button>
        {menuOpen
          ? extraContextChips.map((chip) => {
              const selected = chip === selectedContext;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onSelectContext(chip)}
                  className={classNames(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    selected
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-300/40 dark:bg-indigo-500/15 dark:text-indigo-100"
                      : "border-slate-200 bg-transparent text-slate-500 hover:border-indigo-200 hover:text-indigo-700 dark:border-white/10 dark:text-slate-400 dark:hover:border-indigo-300/30 dark:hover:text-white"
                  )}
                >
                  {chip}
                </button>
              );
            })
          : null}
      </div>
    </div>
  );
}

function QuestionComposer({
  input,
  isThinking,
  textareaRef,
  onChangeInput,
  onSubmit,
  onSubmitQuestion,
}: {
  input: string;
  isThinking: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChangeInput: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitQuestion: (question: string) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="rounded-xl border border-indigo-200 bg-white p-2 shadow-sm ring-1 ring-indigo-100 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-300/40 dark:border-indigo-300/30 dark:bg-gray-950 dark:shadow-none dark:ring-indigo-300/10 dark:focus-within:border-indigo-300/50 dark:focus-within:ring-indigo-400/25">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => onChangeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmitQuestion(input);
              }
            }}
            rows={1}
            placeholder="Type a question about your reports..."
            className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm/6 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <PaperAirplaneIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </div>
    </form>
  );
}

function HelperText({ compact = false }: { compact?: boolean }) {
  return (
    <p className="mt-2 text-center text-xs/5 text-slate-500 dark:text-slate-500">
      {compact ? "Based on uploaded reports." : "Based on your uploaded reports."}
    </p>
  );
}

function MessageBlock({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <article className={classNames("flex items-start gap-2", isUser ? "justify-end" : "")}>
      {!isUser ? <Avatar role="assistant" state={message.state} /> : null}
      <div className={classNames("min-w-0", isUser ? "order-1 max-w-[78%]" : "w-full max-w-[min(80%,56rem)]")}>
        <div
          className={classNames(
            "whitespace-pre-wrap rounded-xl px-4 py-3 text-sm/6",
            isUser
              ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
              : message.state === "error"
                ? "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100"
                : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-100"
          )}
        >
          {message.content}
        </div>
        {!isUser && message.routes?.length ? (
          <div className="mt-2 text-xs/5 text-slate-500 dark:text-slate-400">
            Sources checked: {message.routes.map((route) => friendlySourceName(route.name)).join(", ")}
          </div>
        ) : null}
      </div>
      {isUser ? <Avatar role="user" /> : null}
    </article>
  );
}

function friendlySourceName(name: string) {
  return name
    .replace("Dashboard overview", "Uploaded reports")
    .replace("Performance metrics", "Defect history")
    .replace("Inspection risk", "Reinspection readiness")
    .replace("Live tracker", "Open issue list")
    .replace("Legacy insights", "Repeat issue patterns");
}

function ThinkingBlock() {
  return (
    <div className="flex gap-3">
      <Avatar role="assistant" />
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm/6 text-slate-600 dark:border-white/10 dark:bg-gray-950 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="size-4 animate-spin" aria-hidden="true" />
          Checking your inspection records...
        </div>
      </div>
    </div>
  );
}

function Avatar({
  role,
  state,
}: {
  role: ChatMessage["role"];
  state?: ChatMessage["state"];
}) {
  if (role === "user") {
    return (
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-white/10">
        You
      </span>
    );
  }

  return (
    <span
      className={classNames(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white",
        state === "error" ? "bg-rose-600" : "bg-indigo-600 dark:bg-indigo-500"
      )}
    >
      <SparklesIcon className="size-4" aria-hidden="true" />
    </span>
  );
}

function nextMessageId(
  ref: MutableRefObject<number>,
  role: ChatMessage["role"]
) {
  ref.current += 1;
  return `${role}-${ref.current}`;
}
