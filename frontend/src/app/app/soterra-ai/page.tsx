"use client";

import type { FormEvent, MutableRefObject, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { classNames } from "@/lib/classNames";

type ChatMessage = {
  id: string;
  role: "assistant" | "user" | "tool";
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
  session_id?: string;
  answer?: string;
  detail?: string;
  message?: string;
  used_tools?: Array<{ name: string; reason?: string }>;
  suggested_follow_ups?: string[];
  confidence?: "low" | "medium" | "high";
};

type AgentManifest = {
  enabled?: boolean;
  configured?: boolean;
  provider?: string;
  model_id?: string;
};

type AgentChatSession = {
  id: string;
  title?: string | null;
  created_at: string;
  updated_at: string;
};

type AgentSessionDetail = AgentChatSession & {
  messages?: Array<{
    id: string;
    role: ChatMessage["role"];
    content: string;
    created_at: string;
  }>;
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
  const [sessions, setSessions] = useState<AgentChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState("All reports");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [manifestError, setManifestError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageIdRef = useRef(0);

  useEffect(() => {
    let active = true;

    fetch("/api/agent-chat", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Soterra AI is unavailable.");
        return response.json() as Promise<AgentManifest>;
      })
      .then((payload) => {
        if (active && (!payload.enabled || !payload.configured)) {
          setManifestError("Soterra AI is not enabled or configured yet.");
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

    void loadSessions();

    return () => {
      active = false;
    };
  }, []);

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const response = await fetch("/api/agent-chat/sessions", { cache: "no-store" });
      if (!response.ok) {
        if (response.status !== 401) {
          setManifestError("Chat history is unavailable.");
        }
        return;
      }
      const payload = (await response.json()) as { items?: AgentChatSession[] };
      setSessions(payload.items ?? []);
    } catch {
      setManifestError("Chat history is unavailable.");
    } finally {
      setSessionsLoading(false);
    }
  }

  async function openSession(sessionId: string) {
    if (isThinking || sessionId === currentSessionId) return;
    try {
      const response = await fetch(`/api/agent-chat/sessions/${encodeURIComponent(sessionId)}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as AgentSessionDetail | null;
      if (!response.ok || !payload) {
        throw new Error(payload && "detail" in payload ? String(payload.detail) : "Chat session could not be loaded.");
      }
      setCurrentSessionId(payload.id);
      setMessages(
        (payload.messages ?? [])
          .filter((message) => message.role === "user" || message.role === "assistant")
          .map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            state: message.role === "assistant" ? "ready" : undefined,
          }))
      );
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(messageIdRef, "assistant"),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Chat session could not be loaded.",
          state: "error",
        },
      ]);
    }
  }

  async function deleteSession(sessionId: string) {
    if (isThinking) return;
    const response = await fetch(`/api/agent-chat/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    });
    if (response.ok) {
      if (sessionId === currentSessionId) {
        startNewChat();
      }
      setSessions((current) => current.filter((session) => session.id !== sessionId));
    }
  }

  function startNewChat() {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  }

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
      const response = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          session_id: currentSessionId,
          page_context: selectedContext,
        }),
      });
      const payload = (await response.json().catch(() => null)) as AgentResponse | null;

      if (!response.ok) {
        throw new Error(payload?.answer || payload?.detail || payload?.message || "Soterra AI could not check the records.");
      }

      if (payload?.session_id) {
        setCurrentSessionId(payload.session_id);
      }
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(messageIdRef, "assistant"),
          role: "assistant",
          content:
            payload?.answer?.trim() ||
            "Soterra AI checked the records but did not receive a summary.",
          state: "ready",
        },
      ]);
      void loadSessions();
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
    <div className="flex h-[calc(100vh-6.5rem)] min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-gray-950/50 lg:flex lg:flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-2">
            <ChatBubbleLeftRightIcon className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              Chat history
            </span>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            disabled={isThinking}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-gray-900 dark:text-slate-300 dark:hover:border-indigo-300/40 dark:hover:text-white"
            title="New chat"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">New chat</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {sessionsLoading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
              <ArrowPathIcon className="size-4 animate-spin" aria-hidden="true" />
              Loading chats
            </div>
          ) : sessions.length ? (
            <div className="space-y-1">
              {sessions.map((session) => (
                <SessionButton
                  key={session.id}
                  session={session}
                  selected={session.id === currentSessionId}
                  disabled={isThinking}
                  onOpen={() => openSession(session.id)}
                  onDelete={() => deleteSession(session.id)}
                />
              ))}
            </div>
          ) : (
            <div className="px-2 py-3 text-xs/5 text-slate-500 dark:text-slate-400">
              Your saved agent conversations will appear here.
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
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

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={startNewChat}
            disabled={isThinking}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:border-indigo-300/40 dark:hover:text-white lg:hidden"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            New
          </button>
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
    </div>
  );
}

function SessionButton({
  session,
  selected,
  disabled,
  onOpen,
  onDelete,
}: {
  session: AgentChatSession;
  selected: boolean;
  disabled: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={classNames(
        "group flex items-start gap-1 rounded-lg border px-2 py-2 transition",
        selected
          ? "border-indigo-200 bg-white shadow-sm dark:border-indigo-300/30 dark:bg-gray-900"
          : "border-transparent hover:border-slate-200 hover:bg-white dark:hover:border-white/10 dark:hover:bg-gray-900"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {session.title || "Untitled chat"}
        </span>
        <span className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <ClockIcon className="size-3.5" aria-hidden="true" />
          {formatSessionDate(session.updated_at)}
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 group-hover:opacity-100 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
        title="Delete chat"
      >
        <TrashIcon className="size-4" aria-hidden="true" />
        <span className="sr-only">Delete chat</span>
      </button>
    </div>
  );
}

function formatSessionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
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
      <div className={classNames("min-w-0", isUser ? "order-1 max-w-[78%]" : "w-full max-w-[min(92%,64rem)]")}>
        <div
          className={classNames(
            "rounded-xl text-sm/6",
            isUser
              ? "bg-indigo-600 px-4 py-3 text-white shadow-sm dark:bg-indigo-500"
              : message.state === "error"
                ? "border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100"
                : "text-slate-700 dark:text-slate-100"
          )}
        >
          {isUser || message.state === "error" ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <AgentAnswer content={message.content} />
          )}
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

type AnswerBlock =
  | { type: "paragraph"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "issue-digest"; issues: IssueDisplay[]; summary: AnswerSummary };

function AgentAnswer({ content }: { content: string }) {
  const blocks = parseAgentAnswer(content);
  const summary = extractAnswerSummary(content, blocks);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p
              key={`paragraph-${index}`}
              className={classNames(
                "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm/6 text-slate-700 shadow-sm dark:border-white/10 dark:bg-gray-950/50 dark:text-slate-100",
                index === 0 ? "text-[15px]/7 font-medium" : ""
              )}
            >
              {block.text}
            </p>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <div key={`list-${index}`} className="rounded-lg border border-indigo-100 bg-white p-3 dark:border-indigo-300/20 dark:bg-gray-950/40">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-200">
                Suggested fix order
              </p>
              <ol className="space-y-2">
                {block.items.map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`} className="flex gap-2 text-sm/6 text-slate-700 dark:text-slate-100">
                    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-100">
                      {itemIndex + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        if (block.type === "issue-digest") {
          return <IssueDigest key={`issue-digest-${index}`} issues={block.issues} summary={block.summary} />;
        }

        return <AnswerTable key={`table-${index}`} block={block} summary={summary} />;
      })}
    </div>
  );
}

function AnswerTable({
  block,
  summary,
}: {
  block: Extract<AnswerBlock, { type: "table" }>;
  summary: AnswerSummary;
}) {
  const issueTable = isIssueTable(block.headers);

  if (issueTable) {
    const indexes = issueColumnIndexes(block.headers);
    const issues = block.rows.map((row) => ({
      priority: row[indexes.priority],
      issue: row[indexes.issue],
      location: row[indexes.location],
      trade: row[indexes.trade],
      source: row[indexes.source],
      action: row[indexes.action],
    }));
    return <IssueDigest issues={issues} summary={summary} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-gray-950/40">
      <table className="min-w-full border-collapse text-left text-xs/5">
        <thead className="bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <tr>
            {block.headers.map((header) => (
              <th key={header} scope="col" className="border-b border-slate-200 px-3 py-2 font-semibold dark:border-white/10">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`} className="border-b border-slate-100 last:border-0 dark:border-white/10">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="max-w-72 px-3 py-2 align-top text-slate-700 dark:text-slate-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type AnswerSummary = {
  totalOpen?: number;
  highPriority?: number;
  overdue?: number;
  project?: string;
  address?: string;
};

type IssueDisplay = {
  priority?: string;
  issue?: string;
  location?: string;
  trade?: string;
  source?: string;
  action?: string;
  evidence?: string;
};

function IssueDigest({
  issues,
  summary,
}: {
  issues: IssueDisplay[];
  summary: AnswerSummary;
}) {
  const visibleIssues = issues.slice(0, 6);
  const hiddenIssues = issues.slice(6);
  const criticalCount = issues.filter((issue) => String(issue.priority ?? "").toLowerCase().includes("critical")).length;
  const highCount = issues.filter((issue) => String(issue.priority ?? "").toLowerCase().includes("high")).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-950/50">
      <div className="flex flex-wrap gap-2">
        <SummaryPill label="Open" value={summary.totalOpen ?? issues.length} tone="slate" />
        <SummaryPill label="High priority" value={summary.highPriority ?? criticalCount + highCount} tone="amber" />
        <SummaryPill label="Overdue" value={summary.overdue ?? 0} tone="rose" />
      </div>

      {summary.project || summary.address ? (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm/6 text-slate-700 dark:bg-white/5 dark:text-slate-200">
          <span className="font-semibold">{summary.project || "Project"}</span>
          {summary.address ? <span className="text-slate-500 dark:text-slate-400"> · {summary.address}</span> : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {visibleIssues.map((issue, index) => (
          <IssueCard key={`${issue.issue ?? "issue"}-${index}`} {...issue} />
        ))}
      </div>

      {hiddenIssues.length ? (
        <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-700 dark:text-slate-100 dark:hover:text-indigo-200">
            Show {hiddenIssues.length} more issues
          </summary>
          <div className="space-y-3 border-t border-slate-200 p-3 dark:border-white/10">
            {hiddenIssues.map((issue, index) => (
              <IssueCard key={`${issue.issue ?? "hidden-issue"}-${index}`} {...issue} compact />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "amber" | "rose";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100"
      : tone === "rose"
        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-100"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100";

  return (
    <div className={classNames("rounded-lg border px-3 py-2", toneClass)}>
      <div className="text-lg/5 font-semibold">{value}</div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">{label}</div>
    </div>
  );
}

function IssueCard({
  priority,
  issue,
  location,
  trade,
  source,
  action,
  evidence,
  compact = false,
}: {
  priority?: string;
  issue?: string;
  location?: string;
  trade?: string;
  source?: string;
  action?: string;
  evidence?: string;
  compact?: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-gray-900/60">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 text-[15px]/6 font-semibold text-slate-900 dark:text-white">
          {issue || "Open issue"}
        </h3>
        <span
          className={classNames(
            "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
            priorityTone(priority)
          )}
        >
          {priority || "Priority"}
        </span>
      </div>
      <dl className={classNames("mt-3 grid gap-2", compact ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        <MetaItem label="Location" value={location} wide={!compact} />
        <MetaItem label="Trade" value={trade} />
        <MetaItem label="Source" value={source} wide={!compact} />
      </dl>
      <div className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm/6 text-emerald-900 dark:border-emerald-300/10 dark:bg-emerald-400/10 dark:text-emerald-100">
        <span className="font-semibold">Recommended action: </span>
        {action || "Assign the responsible trade and upload close-out evidence."}
      </div>
      {evidence ? (
        <div className="mt-2 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm/6 text-indigo-900 dark:border-indigo-300/10 dark:bg-indigo-400/10 dark:text-indigo-100">
          <span className="font-semibold">Evidence required: </span>
          {evidence}
        </div>
      ) : null}
    </article>
  );
}

function MetaItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string;
  wide?: boolean;
}) {
  return (
    <div className={classNames("min-w-0", wide ? "sm:col-span-2" : "")}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm/5 text-slate-700 dark:text-slate-100">
        {value || "Not specified"}
      </dd>
    </div>
  );
}

function parseAgentAnswer(content: string): AnswerBlock[] {
  const normalizedContent = normalizeAgentMarkdown(content);
  const actionPlan = parseIssueActionPlan(normalizedContent);
  if (actionPlan.length) return actionPlan;

  const lines = normalizedContent.split(/\r?\n/);
  const blocks: AnswerBlock[] = [];
  let paragraph: string[] = [];
  let index = 0;

  function flushParagraph() {
    const text = paragraph.join(" ").trim();
    if (text && text.toLowerCase() !== "suggested fix order:") {
      blocks.push({ type: "paragraph", text });
    }
    paragraph = [];
  }

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      flushParagraph();
      index += 1;
      continue;
    }

    if (isMarkdownTableStart(lines, index)) {
      flushParagraph();
        const headers = splitMarkdownRow(lines[index]);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        const row = splitMarkdownRow(lines[index]);
        if (row.length === headers.length) rows.push(row);
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(cleanInlineText(lines[index].trim().replace(/^\d+\.\s+/, "")));
        index += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    paragraph.push(cleanInlineText(line));
    index += 1;
  }

  flushParagraph();
  return blocks;
}

function normalizeAgentMarkdown(content: string) {
  return content
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+(Issue\s+\d+:)/gim, "$1")
    .replace(/\s+([-*]\s+Issue\s+\d+:)/g, "\n$1")
    .replace(/\s+(Issue\s+\d+:)/g, "\n$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function cleanInlineText(value: string) {
  return value.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/^\s*[-*]\s+/, "").trim();
}

function parseIssueActionPlan(content: string): AnswerBlock[] {
  const lines = content.split(/\r?\n/).map((line) => cleanInlineText(line)).filter(Boolean);
  if (!lines.some((line) => /^open issues:/i.test(line)) || !lines.some((line) => /^\d+\.\s+/.test(line))) {
    return [];
  }

  const issues: IssueDisplay[] = [];
  const intro: string[] = [];
  let readiness: string | undefined;
  let current: IssueDisplay | undefined;

  for (const line of lines) {
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      if (current) issues.push(current);
      current = { issue: cleanInlineText(numbered[1]) };
      continue;
    }

    const field = line.match(/^(Severity|Priority|Location|Responsible trade|Trade|Source|Fix|Recommended action|Evidence|Evidence required|Reinspection readiness):\s*(.*)$/i);
    if (field) {
      const label = field[1].toLowerCase();
      const value = cleanInlineText(field[2]);
      if (label === "reinspection readiness") {
        readiness = value;
      } else if (!current) {
        intro.push(`${field[1]}: ${value}`);
      } else if (label === "severity" || label === "priority") {
        current.priority = value;
      } else if (label === "location") {
        current.location = value;
      } else if (label === "responsible trade" || label === "trade") {
        current.trade = value;
      } else if (label === "source") {
        current.source = value;
      } else if (label === "fix" || label === "recommended action") {
        current.action = value;
      } else if (label === "evidence" || label === "evidence required") {
        current.evidence = value;
      }
      continue;
    }

    if (!current) {
      intro.push(line);
    } else if (current.action) {
      current.action = `${current.action} ${line}`;
    } else {
      current.action = line;
    }
  }

  if (current) issues.push(current);
  if (!issues.length) return [];

  const firstText = intro.join(" ");
  const summary: AnswerSummary = {
    totalOpen: firstNumberMatch(firstText, /open issues:\s*(\d+)/i) ?? issues.length,
    highPriority:
      firstNumberMatch(firstText, /(\d+)\s+high/i) ??
      issues.filter((issue) => /critical|high/i.test(String(issue.priority ?? ""))).length,
  };

  const blocks: AnswerBlock[] = [];
  if (intro.length) blocks.push({ type: "paragraph", text: intro.join(" ") });
  blocks.push({ type: "issue-digest", issues, summary });
  if (readiness) blocks.push({ type: "paragraph", text: `Reinspection readiness: ${readiness}` });
  return blocks;
}

function extractAnswerSummary(content: string, blocks: AnswerBlock[]): AnswerSummary {
  const firstParagraph = blocks.find((block) => block.type === "paragraph")?.text ?? content;
  const totalOpen = firstNumberMatch(firstParagraph, /found\s+(\d+)\s+open issues/i);
  const highPriority = firstNumberMatch(firstParagraph, /(\d+)\s+are high priority/i);
  const overdue = firstNumberMatch(firstParagraph, /(\d+)\s+are overdue/i);
  const projectMatch = firstParagraph.match(/open issues for (.*?) at /i);
  const addressMatch = firstParagraph.match(/ at (.*?)(?:\.\s|\.$)/i);

  return {
    totalOpen,
    highPriority,
    overdue,
    project: projectMatch?.[1],
    address: addressMatch?.[1],
  };
}

function firstNumberMatch(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match?.[1] ? Number(match[1]) : undefined;
}

function isMarkdownTableStart(lines: string[], index: number) {
  const current = lines[index]?.trim() ?? "";
  const next = lines[index + 1]?.trim() ?? "";
  return current.startsWith("|") && current.endsWith("|") && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(next);
}

function splitMarkdownRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanInlineText(cell));
}

function isIssueTable(headers: string[]) {
  const normalized = headers.map((header) => header.toLowerCase());
  return ["priority", "issue", "location", "trade", "source", "recommended action"].every((header) =>
    normalized.includes(header)
  );
}

function issueColumnIndexes(headers: string[]) {
  const normalized = headers.map((header) => header.toLowerCase());
  return {
    priority: normalized.indexOf("priority"),
    issue: normalized.indexOf("issue"),
    location: normalized.indexOf("location"),
    trade: normalized.indexOf("trade"),
    source: normalized.indexOf("source"),
    action: normalized.indexOf("recommended action"),
  };
}

function priorityTone(priority?: string) {
  const normalized = String(priority ?? "").toLowerCase();
  if (normalized.includes("critical")) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-100";
  }
  if (normalized.includes("high")) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-100";
  }
  if (normalized.includes("medium")) {
    return "bg-sky-100 text-sky-700 dark:bg-sky-300/15 dark:text-sky-100";
  }
  return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200";
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
