"use client";

import type { FormEvent, MutableRefObject, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  structuredResponse?: StructuredResponse;
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
  structured_response?: StructuredResponse;
};

type LocationOption = { project: string; address: string; location: string; open_issue_count: number; high_priority_count: number };
type IssueStatus = "Open" | "In Progress" | "Closed";
type StructuredIssue = { id: string; title: string; exact_location?: string | null; location?: string | null; site?: string; level?: string; unit?: string; area?: string; project?: string; project_name?: string; address?: string; severity?: string; trade?: string; status?: string; what_happened?: string; description?: string; why_it_matters?: string; what_to_do_next?: string; required_fix?: string; evidence_required?: string[]; source_report?: string; report_id?: string; source_page?: number; source_quote?: string; confidence?: number; warnings?: string[] };
type StructuredResponse = { type?: string; options?: LocationOption[]; items?: StructuredIssue[]; issues?: StructuredIssue[]; summary?: Record<string, unknown>; count?: number; critical_count?: number; high_count?: number; follow_up_buttons?: string[]; issue_id?: string; status?: IssueStatus };

type ToastState = {
  title: string;
  message: string;
  tone: "success" | "error";
};

type IssueFacetEntry = { value?: string; count?: number };
type IssueFacets = {
  trades: string[];
  locations: string[];
  severities: string[];
};

type ReportReferenceMaps = {
  byIssueId: Record<string, IssueReportReference>;
  byIssueTitle: Record<string, IssueReportReference>;
  bySourceName: Record<string, string>;
};

type IssueReportReference = {
  reportId: string;
  project?: string;
  site?: string;
  sourceName?: string;
};

type ApiReportReference = {
  id?: unknown;
  project?: unknown;
  site?: unknown;
  sourceFileName?: unknown;
  issues?: unknown;
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

const quickActionPrompts = [
  "High priority only",
  "By trade",
  "Evidence needed",
] as const;

const supportedQuerySuggestions = [
  "Show open issues",
  "Show high priority only",
  "Filter by trade",
  "Summarize reinspection readiness",
  "List evidence needed",
  "Show open fire issues",
  "Show open plumbing issues",
  "Close issue issue-123",
] as const;

const issueStatusOptions: Array<{ label: string; value: IssueStatus }> = [
  { label: "Open", value: "Open" },
  { label: "In progress", value: "In Progress" },
  { label: "Closed", value: "Closed" },
];

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
  const [toast, setToast] = useState<ToastState | null>(null);
  const [issueFacets, setIssueFacets] = useState<IssueFacets>({
    trades: [],
    locations: [],
    severities: [],
  });
  const [reportReferences, setReportReferences] = useState<ReportReferenceMaps>({
    byIssueId: {},
    byIssueTitle: {},
    bySourceName: {},
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageIdRef = useRef(0);
  const autocompleteOptions = useMemo(() => buildQuerySuggestions(issueFacets), [issueFacets]);

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
    void loadReportReferences();
    void loadIssueFacets();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleFollowUp = (event: Event) => {
      setInput((event as CustomEvent<string>).detail);
      textareaRef.current?.focus();
    };
    const handleToast = (event: Event) => {
      const nextToast = (event as CustomEvent<ToastState>).detail;
      setToast(nextToast);
      window.setTimeout(() => {
        setToast((current) => (current === nextToast ? null : current));
      }, 3200);
    };
    window.addEventListener("soterra-chat-follow-up", handleFollowUp);
    window.addEventListener("soterra-chat-toast", handleToast);
    return () => {
      window.removeEventListener("soterra-chat-follow-up", handleFollowUp);
      window.removeEventListener("soterra-chat-toast", handleToast);
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

  async function loadReportReferences() {
    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) return;
      setReportReferences(buildReportReferenceMaps(payload));
    } catch {
      // Issue cards still render without report links if reports are temporarily unavailable.
    }
  }

  async function loadIssueFacets() {
    try {
      const response = await fetch("/api/analytics/facets", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) return;
      setIssueFacets({
        trades: readFacetValues(payload.trades),
        locations: [
          ...readFacetValues(payload.sites),
          ...readFacetValues(payload.levels),
          ...readFacetValues(payload.units),
          ...readFacetValues(payload.areas),
          ...readFacetValues(payload.addresses),
        ],
        severities: readFacetValues(payload.severities),
      });
    } catch {
      // Static suggestions remain available if facets are temporarily unavailable.
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

  function showToast(nextToast: ToastState) {
    setToast(nextToast);
    window.setTimeout(() => {
      setToast((current) => (current === nextToast ? null : current));
    }, 3200);
  }

  async function updateIssueStatus(issueId: string, status: IssueStatus) {
    const response = await fetch("/api/agent-chat/changeIssueStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, status }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.detail || payload?.message || "Issue status could not be updated.");
    }
    showToast({
      title: "Status updated",
      message: confirmationMessageFromIssueUpdate(payload, issueId, status),
      tone: "success",
    });
    void loadIssueFacets();
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
          structuredResponse: payload?.structured_response,
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
    <div className="soterra-ai-panel flex h-[calc(100vh-6.5rem)] min-h-[620px] overflow-hidden rounded-2xl border border-black/10 bg-white/55 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/[0.09] dark:bg-black/45 dark:shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
      {toast ? <ToastNotice toast={toast} /> : null}
      <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-white/36 dark:border-white/[0.08] dark:bg-black/25 lg:flex lg:flex-col">
        <div className="flex h-16 items-center justify-between gap-2 border-b border-black/10 px-4 dark:border-white/[0.08]">
          <div className="flex min-w-0 items-center gap-2">
            <ChatBubbleLeftRightIcon className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              Chats
            </span>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            disabled={isThinking}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white/50 text-slate-500 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
            title="New chat"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">New chat</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
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
            <div className="px-2 py-3 text-xs/5 text-slate-500 dark:text-slate-500">
              No chats yet
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 items-center justify-between gap-4 border-b border-black/10 bg-white/20 px-4 dark:border-white/[0.08] dark:bg-black/10 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="brand-mark inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-white">
            <CpuChipIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base/6 font-semibold tracking-tight text-slate-900 dark:text-white">
              Soterra AI
            </h1>
            <p className="truncate text-[11px]/4 text-slate-500 dark:text-slate-500">Inspection assistant</p>
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
              Offline
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
        <div className="shrink-0 border-b border-black/10 bg-white/15 px-4 py-2.5 dark:border-white/[0.08] dark:bg-black/10 sm:px-6">
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
        <section className="flex h-full min-h-0 flex-col bg-white/10 dark:bg-black/5">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto flex min-h-full max-w-4xl flex-col">
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
                  autocompleteOptions={autocompleteOptions}
                  onSubmit={handleSubmit}
                />
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <MessageBlock
                      key={message.id}
                      message={message}
                      reportReferences={reportReferences}
                      onUpdateIssueStatus={updateIssueStatus}
                    />
                  ))}

                  {isThinking ? <ThinkingBlock /> : null}
                </div>
              )}
            </div>
          </div>

          {messages.length > 0 ? (
            <div className="shrink-0 bg-gradient-to-t from-white/65 via-white/45 to-transparent px-4 pb-4 pt-8 dark:from-black/55 dark:via-black/30 sm:px-6">
              <div className="mx-auto max-w-3xl">
                <QuestionComposer
                  input={input}
                  isThinking={isThinking}
                  textareaRef={textareaRef}
                  onChangeInput={setInput}
                  onSubmit={handleSubmit}
                  onSubmitQuestion={submitQuestion}
                  autocompleteOptions={autocompleteOptions}
                />
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
        "group flex items-start gap-1 rounded-xl border px-2.5 py-2.5 transition",
        selected
          ? "border-indigo-200/80 bg-indigo-50/70 dark:border-indigo-300/20 dark:bg-indigo-400/[0.09]"
          : "border-transparent hover:border-black/5 hover:bg-white/50 dark:hover:border-white/[0.06] dark:hover:bg-white/[0.035]"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="block truncate text-[13px]/5 font-medium text-slate-800 dark:text-slate-200">
          {session.title || "Untitled chat"}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[11px]/4 text-slate-500 dark:text-slate-500">
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

function ToastNotice({ toast }: { toast: ToastState }) {
  const toneClass =
    toast.tone === "success"
      ? "border-emerald-300/30 bg-emerald-950/90 text-emerald-50"
      : "border-rose-300/30 bg-rose-950/90 text-rose-50";

  return (
    <div className="fixed right-5 top-5 z-50 w-[min(24rem,calc(100vw-2.5rem))]">
      <div className={classNames("rounded-xl border px-4 py-3 shadow-2xl backdrop-blur", toneClass)}>
        <p className="text-sm font-semibold">{toast.title}</p>
        <p className="mt-1 text-xs/5 opacity-90">{toast.message}</p>
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
  autocompleteOptions,
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
  autocompleteOptions: string[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-start py-8 sm:justify-center sm:py-10">
      <div className="mx-auto max-w-xl text-center">
        <span className="brand-mark inline-flex size-10 items-center justify-center rounded-xl text-white">
          <SparklesIcon className="size-[18px]" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-balance text-xl font-medium tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[1.65rem]">
          What can I help you check?
        </h2>
      </div>

      <div className="mx-auto mt-7 w-full max-w-2xl">
        <ContextChips
          menuOpen={filterMenuOpen}
          selectedContext={selectedContext}
          onSelectContext={onSelectContext}
          onToggleMenu={onToggleFilterMenu}
        />
      </div>

      <div className="mx-auto mt-5 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {examplePrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
          className="rounded-xl border border-black/10 bg-white/32 px-3.5 py-2.5 text-left text-[13px]/5 font-medium text-slate-600 backdrop-blur transition hover:border-indigo-200 hover:bg-white/65 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-slate-400 dark:hover:border-indigo-300/25 dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-3 w-full max-w-2xl">
        <QuestionComposer
          input={input}
          isThinking={isThinking}
          textareaRef={textareaRef}
          onChangeInput={onChangeInput}
          onSubmit={onSubmit}
          onSubmitQuestion={onSelectPrompt}
          autocompleteOptions={autocompleteOptions}
        />
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
        <span className="text-[11px]/4 font-medium text-slate-500 dark:text-slate-500">
          Scope
        </span>
        <span className="rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-300/40 dark:bg-indigo-500/15 dark:text-indigo-100">
          {selectedContext}
        </span>
        <button
          type="button"
          onClick={onToggleMenu}
          className="rounded-full border border-slate-200 bg-transparent px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-white/10 dark:text-slate-400 dark:hover:border-indigo-300/30 dark:hover:text-white"
        >
          Change
        </button>
        {menuOpen ? (
          <div className="absolute top-10 left-0 z-10 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#0b0b0c]">
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
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {contextChips.map((chip) => {
          const selected = chip === selectedContext;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => onSelectContext(chip)}
              className={classNames(
                "rounded-full border px-3 py-1.5 text-[12px]/4 font-medium transition",
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
          className="rounded-full border border-black/10 bg-white/15 px-3 py-1.5 text-[12px]/4 font-medium text-slate-500 transition hover:border-indigo-200 hover:bg-white/40 hover:text-indigo-700 dark:border-white/[0.08] dark:text-slate-500 dark:hover:border-indigo-300/25 dark:hover:bg-white/[0.04] dark:hover:text-white"
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
  autocompleteOptions,
}: {
  input: string;
  isThinking: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChangeInput: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitQuestion: (question: string) => void;
  autocompleteOptions: string[];
}) {
  const visibleSuggestions = useMemo(() => {
    const query = input.trim().toLowerCase();
    if (!query) return [];
    return uniqueStrings([...supportedQuerySuggestions, ...autocompleteOptions])
      .filter((suggestion) => suggestion.toLowerCase().includes(query))
      .slice(0, 4);
  }, [autocompleteOptions, input]);

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-2 flex flex-wrap gap-2">
        {quickActionPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={isThinking}
            onClick={() => {
              if (prompt === "By trade") {
                onChangeInput("Show open issues for ");
                textareaRef.current?.focus();
                return;
              }
              if (prompt === "High priority only") {
                onSubmitQuestion("Show high priority only");
                return;
              }
              if (prompt === "Evidence needed") {
                onSubmitQuestion("List evidence needed");
                return;
              }
            }}
            className="rounded-full border border-black/10 bg-white/45 px-3 py-1.5 text-[12px]/4 font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-300 dark:hover:border-indigo-300/30 dark:hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-black/10 bg-white/70 p-2 shadow-[0_14px_45px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-300/20 dark:border-white/[0.11] dark:bg-black/45 dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)] dark:focus-within:border-indigo-300/35 dark:focus-within:ring-indigo-400/15">
        {visibleSuggestions.length ? (
          <div className="mb-1 grid gap-1 border-b border-black/10 pb-2 dark:border-white/10">
            {visibleSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isThinking}
                onClick={() => {
                  onChangeInput(suggestion);
                  textareaRef.current?.focus();
                }}
                className="rounded-lg px-3 py-2 text-left text-[12px]/4 font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
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
            placeholder="Ask about your reports"
            className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[13px]/6 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <PaperAirplaneIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </div>
    </form>
  );
}

function MessageBlock({
  message,
  reportReferences,
  onUpdateIssueStatus,
}: {
  message: ChatMessage;
  reportReferences: ReportReferenceMaps;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus) => Promise<void>;
}) {
  const isUser = message.role === "user";
  // Prefer backend issue payloads over prose so cards stay grouped and actionable.
  const hasStructuredIssues = hasIssueListResponse(message.structuredResponse);

  return (
    <article className={classNames("flex items-start gap-3", isUser ? "justify-end" : "")}>
      {!isUser ? <Avatar role="assistant" state={message.state} /> : null}
      <div className={classNames("min-w-0", isUser ? "order-1 max-w-[78%]" : "w-full max-w-[min(92%,48rem)]")}>
        <div
          className={classNames(
            "rounded-2xl text-[13px]/6",
            isUser
              ? "bg-slate-900 px-4 py-2.5 text-white shadow-sm dark:bg-white/[0.09]"
              : message.state === "error"
                ? "border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-100"
                : "text-slate-700 dark:text-slate-100"
          )}
        >
          {isUser || message.state === "error" ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : hasStructuredIssues && message.structuredResponse ? (
            <StructuredAgentResponse
              response={message.structuredResponse}
              reportReferences={reportReferences}
              onUpdateIssueStatus={onUpdateIssueStatus}
            />
          ) : (
            <>
              <AgentAnswer
                content={message.content}
                reportReferences={reportReferences}
                onUpdateIssueStatus={onUpdateIssueStatus}
              />
              {message.structuredResponse ? (
                <StructuredAgentResponse
                  response={message.structuredResponse}
                  reportReferences={reportReferences}
                  onUpdateIssueStatus={onUpdateIssueStatus}
                />
              ) : null}
            </>
          )}
        </div>
        {!isUser && message.routes?.length ? (
          <div className="mt-2 text-xs/5 text-slate-500 dark:text-slate-400">
            Sources checked: {message.routes.map((route) => friendlySourceName(route.name)).join(", ")}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function StructuredAgentResponse({
  response,
  reportReferences,
  onUpdateIssueStatus,
}: {
  response: StructuredResponse;
  reportReferences: ReportReferenceMaps;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus) => Promise<void>;
}) {
  if (response.type === "location_clarification") {
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {response.options?.map((option) => (
          <button
            key={`${option.project}-${option.location}`}
            type="button"
            className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none dark:hover:bg-indigo-500/10"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("soterra-chat-follow-up", {
                  detail: `Show open issues at ${option.location}`,
                })
              )
            }
          >
            <div className="font-semibold text-slate-900 dark:text-white">
              {option.project}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {[option.address, option.location].filter(Boolean).join(" | ")}
            </div>
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              {option.open_issue_count} open | {option.high_priority_count} high priority
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (hasIssueListResponse(response)) {
    const issues = issuesFromStructuredResponse(response);
    return (
      <GroupedIssueSummary
        issues={issues}
        summary={summaryFromStructuredResponse(response, issues)}
        reportReferences={reportReferences}
        onUpdateIssueStatus={onUpdateIssueStatus}
      />
    );
  }

  return null;
}

type AnswerBlock =
  | { type: "paragraph"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "issue-digest"; issues: IssueDisplay[]; summary: AnswerSummary };

function AgentAnswer({
  content,
  reportReferences,
  onUpdateIssueStatus,
}: {
  content: string;
  reportReferences: ReportReferenceMaps;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus) => Promise<void>;
}) {
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
                "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm/6 text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100",
                index === 0 ? "text-[15px]/7 font-medium" : ""
              )}
            >
              {block.text}
            </p>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <div key={`list-${index}`} className="rounded-xl border border-indigo-100 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
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
          return (
            <GroupedIssueSummary
              key={`issue-digest-${index}`}
              issues={block.issues}
              summary={block.summary}
              reportReferences={reportReferences}
              onUpdateIssueStatus={onUpdateIssueStatus}
            />
          );
        }

        return (
          <AnswerTable
            key={`table-${index}`}
            block={block}
            summary={summary}
            reportReferences={reportReferences}
            onUpdateIssueStatus={onUpdateIssueStatus}
          />
        );
      })}
    </div>
  );
}

function AnswerTable({
  block,
  summary,
  reportReferences,
  onUpdateIssueStatus,
}: {
  block: Extract<AnswerBlock, { type: "table" }>;
  summary: AnswerSummary;
  reportReferences: ReportReferenceMaps;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus) => Promise<void>;
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
    return (
      <GroupedIssueSummary
        issues={issues}
        summary={summary}
        reportReferences={reportReferences}
        onUpdateIssueStatus={onUpdateIssueStatus}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
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
  id?: string;
  priority?: string;
  status?: string;
  issue?: string;
  project?: string;
  location?: string;
  trade?: string;
  source?: string;
  action?: string;
  evidence?: string;
};

function GroupedIssueSummary({
  issues,
  summary,
  reportReferences,
  onUpdateIssueStatus,
}: {
  issues: IssueDisplay[];
  summary: AnswerSummary;
  reportReferences: ReportReferenceMaps;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus) => Promise<void>;
}) {
  const criticalCount = issues.filter((issue) => String(issue.priority ?? "").toLowerCase().includes("critical")).length;
  const highCount = issues.filter((issue) => String(issue.priority ?? "").toLowerCase().includes("high")).length;
  const groups = groupIssuesByTradeAndSeverity(issues);

  return (
    <section className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
      <details open>
        <summary className="cursor-pointer list-none px-4 py-4 marker:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Open issue summary
              </p>
              <p className="mt-1 text-xs/5 text-slate-500 dark:text-slate-400">
                Grouped by responsible trade and priority so each crew sees the next work clearly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SummaryPill label="Open" value={summary.totalOpen ?? issues.length} tone="slate" />
              <SummaryPill label="High priority" value={summary.highPriority ?? criticalCount + highCount} tone="amber" />
              <SummaryPill label="Overdue" value={summary.overdue ?? 0} tone="rose" />
            </div>
          </div>
          {summary.project || summary.address ? (
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm/6 text-slate-700 dark:bg-white/5 dark:text-slate-200">
              <span className="font-semibold">{summary.project || "Project"}</span>
              {summary.address ? <span className="text-slate-500 dark:text-slate-400"> | {summary.address}</span> : null}
            </div>
          ) : null}
        </summary>

        <div className="space-y-3 border-t border-slate-200 p-4 dark:border-white/10">
          {groups.map((group) => (
            <IssueGroup
              key={group.key}
              group={group}
              project={summary.project}
              reportReferences={reportReferences}
              onUpdateIssueStatus={onUpdateIssueStatus}
            />
          ))}
        </div>
      </details>
    </section>
  );
}

function IssueGroup({
  group,
  project,
  reportReferences,
  onUpdateIssueStatus,
}: {
  group: IssueGroupModel;
  project?: string;
  reportReferences: ReportReferenceMaps;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleIssues = expanded ? group.issues : group.issues.slice(0, 2);
  const hiddenCount = group.issues.length - visibleIssues.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/75 p-3 dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {group.trade} / {group.severity}
        </h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">
          {group.issues.length} issue{group.issues.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {visibleIssues.map((issue, index) => (
          <IssueCard
            key={issue.id || `${group.key}-${issue.issue ?? "issue"}-${index}`}
            {...issue}
            project={issue.project || project}
            reportReferences={reportReferences}
            onUpdateIssueStatus={onUpdateIssueStatus}
            compact
          />
        ))}
      </div>
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-indigo-300/30 dark:hover:text-white"
        >
          Show {hiddenCount} more
        </button>
      ) : expanded && group.issues.length > 2 ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-indigo-300/30 dark:hover:text-white"
        >
          Show less
        </button>
      ) : null}
    </div>
  );
}

type IssueGroupModel = {
  key: string;
  trade: string;
  severity: string;
  issues: IssueDisplay[];
};

function hasIssueListResponse(response?: StructuredResponse) {
  return Boolean(response && (Array.isArray(response.items) || Array.isArray(response.issues)));
}

function issuesFromStructuredResponse(response: StructuredResponse): IssueDisplay[] {
  const rawIssues = response.items ?? response.issues ?? [];
  return rawIssues.map((issue) => ({
    id: issue.id,
    priority: issue.severity,
    status: issue.status,
    issue: issue.title || "Inspection issue",
    project: issue.project || issue.project_name,
    location: [
      issue.exact_location || issue.location,
      issue.site,
      issue.level,
      issue.unit,
      issue.area,
      issue.address,
    ].filter(Boolean).join(" | "),
    trade: issue.trade,
    source: [
      issue.source_report || issue.report_id,
      issue.source_page ? `page ${issue.source_page}` : "",
    ].filter(Boolean).join(" | "),
    action: issue.what_to_do_next || issue.required_fix || issue.description || issue.what_happened,
    evidence: Array.isArray(issue.evidence_required) ? issue.evidence_required.filter(Boolean).join(", ") : undefined,
  }));
}

function summaryFromStructuredResponse(response: StructuredResponse, issues: IssueDisplay[]): AnswerSummary {
  const summary = response.summary ?? {};
  const openFromSummary = readNumber(summary, "open") ?? readNumber(summary, "openIssues");
  return {
    totalOpen: response.count ?? openFromSummary ?? issues.length,
    highPriority: (response.critical_count ?? 0) + (response.high_count ?? 0) || undefined,
  };
}

function groupIssuesByTradeAndSeverity(issues: IssueDisplay[]): IssueGroupModel[] {
  const groups = new Map<string, IssueGroupModel>();
  for (const issue of issues) {
    const trade = cleanGroupLabel(issue.trade, "Unassigned trade");
    const severity = cleanGroupLabel(issue.priority, "Priority not stated");
    const key = `${trade.toLowerCase()}::${severity.toLowerCase()}`;
    const group = groups.get(key) ?? { key, trade, severity, issues: [] };
    group.issues.push(issue);
    groups.set(key, group);
  }
  return Array.from(groups.values()).sort((left, right) => {
    const priorityDelta = severitySortValue(left.severity) - severitySortValue(right.severity);
    return priorityDelta || left.trade.localeCompare(right.trade);
  });
}

function cleanGroupLabel(value: string | undefined, fallback: string) {
  const trimmed = String(value ?? "").trim();
  return trimmed || fallback;
}

function severitySortValue(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("critical")) return 0;
  if (normalized.includes("high")) return 1;
  if (normalized.includes("medium")) return 2;
  if (normalized.includes("low")) return 3;
  return 4;
}

function readNumber(source: Record<string, unknown>, key: string) {
  const value = source[key];
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return undefined;
}

function readFacetValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const entry = item as IssueFacetEntry;
      return typeof entry.value === "string" ? entry.value.trim() : "";
    })
    .filter(Boolean);
}

function buildQuerySuggestions(facets: IssueFacets): string[] {
  const tradeSuggestions = facets.trades
    .filter((trade) => trade.toLowerCase() !== "general")
    .slice(0, 8)
    .map((trade) => `Show open ${trade} issues`);
  const locationSuggestions = facets.locations
    .slice(0, 8)
    .map((location) => `Show open issues at ${location}`);
  const severitySuggestions = (facets.severities.length ? facets.severities : ["Critical", "High", "Medium", "Low"])
    .slice(0, 4)
    .map((severity) => `Show ${severity.toLowerCase()} priority issues`);
  return uniqueStrings([...severitySuggestions, ...tradeSuggestions, ...locationSuggestions]).slice(0, 20);
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function confirmationMessageFromIssueUpdate(payload: unknown, issueId: string, status: IssueStatus) {
  if (payload && typeof payload === "object") {
    const record = payload as { message?: unknown; item?: { status?: unknown; id?: unknown } };
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim();
    }
    if (record.item && typeof record.item.status === "string") {
      return `${String(record.item.id || issueId)} is now ${formatIssueStatus(normalizeIssueStatus(record.item.status))}.`;
    }
  }
  return `${issueId} is now ${formatIssueStatus(status)}.`;
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
  id,
  priority,
  status,
  issue,
  project,
  location,
  trade,
  source,
  action,
  evidence,
  reportReferences,
  onUpdateIssueStatus,
  compact = false,
}: {
  id?: string;
  priority?: string;
  status?: string;
  issue?: string;
  project?: string;
  location?: string;
  trade?: string;
  source?: string;
  action?: string;
  evidence?: string;
  reportReferences: ReportReferenceMaps;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus) => Promise<void>;
  compact?: boolean;
}) {
  const [currentStatus, setCurrentStatus] = useState<IssueStatus>(normalizeIssueStatus(status));
  const [pendingStatus, setPendingStatus] = useState(false);
  useEffect(() => {
    setCurrentStatus(normalizeIssueStatus(status));
  }, [status]);
  const issueReference = resolveIssueReportReference({
    issueId: id,
    issueTitle: issue,
    source,
    reportReferences,
  });
  const reportHref = issueReference ? `/app/reports/${encodeURIComponent(issueReference.reportId)}` : resolveReportHref({ source, reportReferences });
  const inferredProject = project || [issueReference?.project, issueReference?.site].filter(Boolean).join(" | ");
  const displayedLocation = location || "Location not specified";
  const displayedSource = source && source !== "Not specified" ? source : issueReference?.sourceName;

  async function handleStatusChange(nextStatus: IssueStatus) {
    if (!id || nextStatus === currentStatus) return;
    const previousStatus = currentStatus;
    setCurrentStatus(nextStatus);
    setPendingStatus(true);
    try {
      await onUpdateIssueStatus(id, nextStatus);
    } catch {
      setCurrentStatus(previousStatus);
      window.dispatchEvent(
        new CustomEvent("soterra-chat-toast", {
          detail: {
            title: "Status update failed",
            message: `${id} could not be updated. Please try again.`,
            tone: "error",
          } satisfies ToastState,
        })
      );
    } finally {
      setPendingStatus(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 text-[15px]/6 font-semibold text-slate-900 dark:text-white">
          {reportHref ? (
            <Link href={reportHref} className="underline-offset-4 hover:text-indigo-700 hover:underline dark:hover:text-indigo-200">
              {issue || "Open issue"}
            </Link>
          ) : (
            issue || "Open issue"
          )}
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
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" htmlFor={id ? `status-${id}` : undefined}>
          Status
        </label>
        <select
          id={id ? `status-${id}` : undefined}
          value={currentStatus}
          disabled={!id || pendingStatus}
          onChange={(event) => void handleStatusChange(event.target.value as IssueStatus)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:bg-black/35 dark:text-slate-100 dark:focus:border-indigo-300/40"
        >
          {issueStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {!id ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Issue ID needed to update
          </span>
        ) : null}
      </div>
      <dl className={classNames("mt-3 grid gap-2", compact ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        <MetaItem label="Project / location" value={[inferredProject, displayedLocation].filter(Boolean).join(" | ")} wide={!compact} />
        <MetaItem label="Trade" value={trade} />
        <MetaItem label="Source report" value={displayedSource} href={reportHref} wide={!compact} />
      </dl>
      <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm/6 text-emerald-900 dark:border-emerald-300/10 dark:bg-emerald-400/10 dark:text-emerald-100">
        <span className="font-semibold">Recommended action: </span>
        {action || "Assign the responsible trade and upload close-out evidence."}
      </div>
      {evidence ? (
        <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm/6 text-indigo-900 dark:border-indigo-300/10 dark:bg-indigo-400/10 dark:text-indigo-100">
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
  href,
  wide = false,
}: {
  label: string;
  value?: string;
  href?: string | null;
  wide?: boolean;
}) {
  const displayValue = value || "Not specified";

  return (
    <div className={classNames("min-w-0", wide ? "sm:col-span-2" : "")}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm/5 text-slate-700 dark:text-slate-100">
        {href ? (
          <Link href={href} className="font-semibold text-indigo-700 underline-offset-4 hover:underline dark:text-indigo-300">
            {displayValue}
          </Link>
        ) : (
          displayValue
        )}
      </dd>
    </div>
  );
}

function buildReportReferenceMaps(payload: unknown): ReportReferenceMaps {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && "items" in payload && Array.isArray(payload.items)
      ? payload.items
      : [];
  const byIssueId: Record<string, IssueReportReference> = {};
  const byIssueTitle: Record<string, IssueReportReference> = {};
  const bySourceName: Record<string, string> = {};

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const report = item as ApiReportReference;
    const reportId = typeof report.id === "string" ? report.id : "";
    if (!reportId) continue;
    const project = typeof report.project === "string" ? report.project : undefined;
    const site = typeof report.site === "string" ? report.site : undefined;
    const sourceName = typeof report.sourceFileName === "string" ? report.sourceFileName : undefined;
    const reference: IssueReportReference = { reportId, project, site, sourceName };

    addReportNameKey(bySourceName, report.sourceFileName, reportId);
    addReportNameKey(bySourceName, report.project, reportId);
    addReportNameKey(bySourceName, report.site, reportId);

    if (Array.isArray(report.issues)) {
      for (const issue of report.issues) {
        if (!issue || typeof issue !== "object") continue;
        const issueRecord = issue as { id?: unknown; title?: unknown };
        if (typeof issueRecord.id === "string" && issueRecord.id.trim()) {
          byIssueId[issueRecord.id.trim()] = reference;
        }
        if (typeof issueRecord.title === "string" && issueRecord.title.trim()) {
          byIssueTitle[normalizeReportLookupKey(issueRecord.title)] = reference;
        }
        addReportNameKey(bySourceName, issueRecord.title, reportId);
      }
    }
  }

  return { byIssueId, byIssueTitle, bySourceName };
}

function addReportNameKey(target: Record<string, string>, value: unknown, reportId: string) {
  if (typeof value !== "string" || !value.trim()) return;
  const normalized = normalizeReportLookupKey(value);
  if (normalized) target[normalized] = reportId;
}

function resolveReportHref({
  issueId,
  issueTitle,
  source,
  reportReferences,
}: {
  issueId?: string;
  issueTitle?: string;
  source?: string;
  reportReferences: ReportReferenceMaps;
}) {
  const reference = resolveIssueReportReference({ issueId, issueTitle, source, reportReferences });
  const reportId: string | undefined = reference?.reportId ?? resolveReportIdFromSource(source, reportReferences);
  return reportId ? `/app/reports/${encodeURIComponent(reportId)}` : null;
}

function resolveIssueReportReference({
  issueId,
  issueTitle,
  source,
  reportReferences,
}: {
  issueId?: string;
  issueTitle?: string;
  source?: string;
  reportReferences: ReportReferenceMaps;
}) {
  if (issueId && reportReferences.byIssueId[issueId]) {
    return reportReferences.byIssueId[issueId];
  }

  const normalizedIssueTitle = issueTitle ? normalizeReportLookupKey(issueTitle) : "";
  if (normalizedIssueTitle && reportReferences.byIssueTitle[normalizedIssueTitle]) {
    return reportReferences.byIssueTitle[normalizedIssueTitle];
  }

  if (normalizedIssueTitle) {
    const fuzzyTitle = Object.entries(reportReferences.byIssueTitle).find(
      ([title]) => normalizedIssueTitle.includes(title) || title.includes(normalizedIssueTitle)
    )?.[1];
    if (fuzzyTitle) return fuzzyTitle;
  }

  const reportId = resolveReportIdFromSource(source, reportReferences);
  return reportId ? { reportId, sourceName: source } : undefined;
}

function resolveReportIdFromSource(source: string | undefined, reportReferences: ReportReferenceMaps): string | undefined {
  if (!source) return undefined;
  const normalizedSource = normalizeReportLookupKey(source);
  if (reportReferences.bySourceName[normalizedSource]) {
    return reportReferences.bySourceName[normalizedSource];
  }

  const sourceWithoutPage = normalizeReportLookupKey(source.replace(/\bpage\s+\d+\b/gi, ""));
  if (reportReferences.bySourceName[sourceWithoutPage]) {
    return reportReferences.bySourceName[sourceWithoutPage];
  }

  return Object.entries(reportReferences.bySourceName).find(
    ([name]) => normalizedSource.includes(name) || name.includes(normalizedSource)
  )?.[1];
}

function normalizeReportLookupKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\bpage\s+\d+\b/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

    const field = line.match(/^(Issue ID|ID|Status|Severity|Priority|Location|Responsible trade|Trade|Source|Fix|Recommended action|Evidence|Evidence required|Reinspection readiness):\s*(.*)$/i);
    if (field) {
      const label = field[1].toLowerCase();
      const value = cleanInlineText(field[2]);
      if (label === "reinspection readiness") {
        readiness = value;
      } else if (!current) {
        intro.push(`${field[1]}: ${value}`);
      } else if (label === "issue id" || label === "id") {
        current.id = value;
      } else if (label === "status") {
        current.status = value;
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

function normalizeIssueStatus(status?: string): IssueStatus {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "closed") return "Closed";
  if (normalized === "in progress" || normalized === "in-progress") return "In Progress";
  return "Open";
}

function formatIssueStatus(status: IssueStatus) {
  return status === "In Progress" ? "In progress" : status;
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
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm/6 text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="size-4 animate-spin" aria-hidden="true" />
          Checking records...
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
