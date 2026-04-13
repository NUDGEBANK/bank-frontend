import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Bot,
  MessageSquarePlus,
  PanelLeft,
  Pencil,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  deleteChatSession,
  getChatSession,
  getChatSessions,
  renameChatSession,
  sendMessage,
  type ChatMessageItem,
  type ChatSessionDetail,
  type ChatSessionSummary,
} from "../../api/chat";
import { Button } from "../../components/ui/button";

type ComposerState = {
  value: string;
  isStreaming: boolean;
};

type QuickReplyAction =
  | {
      type: "ask";
      value: string;
    }
  | {
      type: "navigate";
      href: string;
    };

type QuickReply = {
  label: string;
  action: QuickReplyAction;
};

type ViewMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  createdAt: string | null;
  quickReplies?: QuickReply[]; // 메시지별 버튼형 응답
};

const UI_TEXT = {
  eyebrow: "NUDGEBOT",
  title: "상담 기록",
  subtitle: "이전 상담을 이어서 확인하고, 새 질문을 바로 이어갈 수 있습니다.",
  newChat: "새 대화",
  emptyList: "아직 저장된 상담이 없습니다.",
  loadingList: "대화 목록을 불러오는 중입니다.",
  loadingDetail: "대화를 불러오는 중입니다.",
  emptyThreadTitle: "새 상담을 시작해보세요",
  emptyThreadBody:
    "왼쪽 기록을 열거나 아래 입력창에서 바로 질문을 보내면 새 세션이 생성됩니다.",
  inputPlaceholder: "대출, 신용점수, 상품 추천 등 궁금한 점을 입력하세요",
  unauthorized: "로그인 후 채팅 기록을 확인할 수 있습니다.",
  listError: "채팅 목록을 불러오지 못했습니다.",
  detailError: "선택한 대화를 불러오지 못했습니다.",
  streamingError: "답변을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.",
} as const;

const DEFAULT_LOAN_QUICK_REPLIES: QuickReply[] = [
  {
    label: "상품 설명 보기",
    action: { type: "ask", value: "대출 상품 설명 자세히 보여줘" },
  },
  {
    label: "가능 여부 조회",
    action: { type: "ask", value: "이 상품이 나한테 맞는지 알려줘" },
  },
  {
    label: "신청 안내 보기",
    action: { type: "navigate", href: "/loan/apply" },
  },
];

// 챗봇 응답 텍스트에 기반해 버튼형 응답을 생성하는 함수
function buildQuickReplies(botText: string): QuickReply[] {
  const text = botText.toLowerCase();

  if (
    text.includes("대출") ||
    text.includes("상품") ||
    text.includes("신청") ||
    text.includes("심사") ||
    text.includes("한도")
  ) {
    return DEFAULT_LOAN_QUICK_REPLIES;
  }

  return [];
}

function formatRelativeLabel(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// 챗봇 API에서 받아온 메시지 데이터를 화면에 표시할 메시지 형태로 변환하는 함수
function mapMessages(messages: ChatMessageItem[]): ViewMessage[] {
  return messages.map((message) => {
    const sender = message.sender_type === "USER" ? "user" : "bot";
    const text = message.message_content;

    return {
      id: String(message.message_id),
      sender,
      text,
      createdAt: message.created_at,
      quickReplies: sender === "bot" ? buildQuickReplies(text) : undefined,
    };
  });
}

export default function ChatHistory() {
  const navigate = useNavigate(); // 챗봇 버튼에서 페이지 이동을 위해 추가

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ChatSessionDetail | null>(
    null,
  );
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [pendingActionSessionId, setPendingActionSessionId] = useState<
    string | null
  >(null);
  const [composer, setComposer] = useState<ComposerState>({
    value: "",
    isStreaming: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const visibleMessages = useMemo(
    () => (activeSession ? mapMessages(activeSession.messages) : []),
    [activeSession],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [visibleMessages, composer.isStreaming]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (composer.isStreaming) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [composer.isStreaming, activeSessionId]);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      setListLoading(true);
      setListError("");

      try {
        const data = await getChatSessions();
        if (!isMounted) {
          return;
        }

        setSessions(data);
        setActiveSessionId((current) => current ?? data[0]?.session_id ?? null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "";
        setListError(
          message.includes("401") ? UI_TEXT.unauthorized : UI_TEXT.listError,
        );
      } finally {
        if (isMounted) {
          setListLoading(false);
        }
      }
    }

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setActiveSession(null);
      setDetailError("");
      setDetailLoading(false);
      return;
    }

    let isMounted = true;

    async function loadSessionDetail() {
      setDetailLoading(true);
      setDetailError("");

      try {
        const data = await getChatSession(activeSessionId);
        if (!isMounted) {
          return;
        }
        setActiveSession(data);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setDetailError(
          error instanceof Error && error.message.includes("401")
            ? UI_TEXT.unauthorized
            : UI_TEXT.detailError,
        );
      } finally {
        if (isMounted) {
          setDetailLoading(false);
        }
      }
    }

    void loadSessionDetail();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId]);

  async function refreshSessions(preferredSessionId: string | null) {
    const data = await getChatSessions();
    setSessions(data);

    if (
      preferredSessionId &&
      data.some((session) => session.session_id === preferredSessionId)
    ) {
      setActiveSessionId(preferredSessionId);
      return;
    }

    setActiveSessionId(data[0]?.session_id ?? null);
  }

  async function submitMessage(rawMessage: string) {
    const trimmed = rawMessage.trim();
    if (!trimmed || composer.isStreaming) {
      return;
    }

    const draftSessionId = activeSessionId;
    const draftTitle = activeSession?.title ?? trimmed;

    setComposer({ value: "", isStreaming: true });
    setDetailError("");

    setActiveSession((current) => ({
      session_id: current?.session_id ?? draftSessionId ?? "pending",
      title: current?.title ?? draftTitle,
      created_at: current?.created_at ?? null,
      updated_at: current?.updated_at ?? null,
      messages: [
        ...(current?.messages ?? []),
        {
          message_id: Date.now(),
          sender_type: "USER",
          message_content: trimmed,
          created_at: new Date().toISOString(),
        },
        {
          message_id: Date.now() + 1,
          sender_type: "BOT",
          message_content: "",
          created_at: new Date().toISOString(),
        },
      ],
    }));

    try {
      const nextSessionId = await sendMessage(
        "web-user",
        trimmed,
        (chunk) => {
          setActiveSession((current) => {
            if (!current) {
              return current;
            }

            const messages = [...current.messages];
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.sender_type === "BOT") {
              messages[messages.length - 1] = {
                ...lastMessage,
                message_content: `${lastMessage.message_content}${chunk}`,
              };
            }

            return { ...current, messages };
          });
        },
        draftSessionId ?? undefined,
      );

      await refreshSessions(nextSessionId ?? draftSessionId ?? null);
    } catch (error) {
      console.error(error);
      setDetailError(UI_TEXT.streamingError);
    } finally {
      setComposer((current) => ({ ...current, isStreaming: false }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(composer.value);
  }

  // 챗봇 버튼 클릭 시 재질문 또는 화면 이동
  async function handleQuickReplyClick(reply: QuickReply) {
    if (reply.action.type === "ask") {
      await submitMessage(reply.action.value);
      return;
    }

    navigate(reply.action.href);
  }

  async function handleRenameSession(session: ChatSessionSummary) {
    const nextTitle = window.prompt("채팅 이름을 입력하세요", session.title);
    if (nextTitle === null) {
      return;
    }

    const trimmedTitle = nextTitle.trim();
    if (!trimmedTitle || trimmedTitle === session.title) {
      return;
    }

    setPendingActionSessionId(session.session_id);
    setListError("");

    try {
      const updatedSession = await renameChatSession(
        session.session_id,
        trimmedTitle,
      );
      setSessions((current) =>
        current.map((item) =>
          item.session_id === session.session_id ? updatedSession : item,
        ),
      );
      setActiveSession((current) =>
        current && current.session_id === session.session_id
          ? {
              ...current,
              title: updatedSession.title,
              updated_at: updatedSession.updated_at,
            }
          : current,
      );
    } catch (error) {
      console.error(error);
      setListError("채팅 이름을 변경하지 못했습니다.");
    } finally {
      setPendingActionSessionId(null);
    }
  }

  async function handleDeleteSession(session: ChatSessionSummary) {
    const confirmed = window.confirm(`"${session.title}" 상담을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setPendingActionSessionId(session.session_id);
    setListError("");

    try {
      await deleteChatSession(session.session_id);

      const remainingSessions = sessions.filter(
        (item) => item.session_id !== session.session_id,
      );
      setSessions(remainingSessions);

      if (activeSessionId === session.session_id) {
        const nextSessionId = remainingSessions[0]?.session_id ?? null;
        setActiveSessionId(nextSessionId);
        if (!nextSessionId) {
          setActiveSession(null);
          setDetailError("");
        }
      }
    } catch (error) {
      console.error(error);
      setListError("채팅을 삭제하지 못했습니다.");
    } finally {
      setPendingActionSessionId(null);
    }
  }

  const currentTitle = activeSession?.title ?? "NUDGEBOT";

  return (
    <div className="min-h-[calc(100vh-88px)] bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f9fbff_24%,_#ffffff_100%)]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-6 lg:h-[calc(100vh-88px)] lg:flex-row lg:overflow-hidden lg:py-8">
        <aside className="w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(7,30,66,0.98)_0%,_rgba(14,52,110,0.98)_100%)] text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] lg:w-[320px] lg:shrink-0">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-2 text-sky-100">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
                  {UI_TEXT.eyebrow}
                </p>
                <h1 className="mt-1 text-xl font-semibold">{UI_TEXT.title}</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-200/80">
              {UI_TEXT.subtitle}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveSessionId(null);
                setActiveSession(null);
                setDetailError("");
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              <MessageSquarePlus className="h-4 w-4" />
              {UI_TEXT.newChat}
            </button>
          </div>

          <div className="max-h-[48vh] overflow-y-auto px-3 py-3 lg:h-[calc(100%-210px)] lg:max-h-none">
            {listLoading ? (
              <p className="px-3 py-4 text-sm text-slate-300">
                {UI_TEXT.loadingList}
              </p>
            ) : listError ? (
              <p className="px-3 py-4 text-sm text-rose-200">{listError}</p>
            ) : sessions.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-300">
                {UI_TEXT.emptyList}
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => {
                  const isActive = session.session_id === activeSessionId;

                  return (
                    <div
                      key={session.session_id}
                      className={`w-full rounded-2xl border px-4 py-3 transition ${
                        isActive
                          ? "border-sky-300/50 bg-white/14 shadow-[0_16px_30px_rgba(15,23,42,0.2)]"
                          : "border-white/8 bg-white/[0.06] hover:bg-white/[0.1]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveSessionId(session.session_id)}
                          className="flex-1 text-left"
                        >
                          <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                            {session.title}
                          </p>
                          <p className="mt-2 text-xs text-slate-300/80">
                            {formatRelativeLabel(
                              session.updated_at ?? session.created_at,
                            )}
                          </p>
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="이름 변경"
                            disabled={
                              pendingActionSessionId === session.session_id
                            }
                            onClick={() => {
                              void handleRenameSession(session);
                            }}
                            className="rounded-lg p-1.5 text-slate-300/80 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="삭제"
                            disabled={
                              pendingActionSessionId === session.session_id
                            }
                            onClick={() => {
                              void handleDeleteSession(session);
                            }}
                            className="rounded-lg p-1.5 text-slate-300/80 transition hover:bg-rose-400/20 hover:text-rose-100 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <PanelLeft className="mt-0.5 h-4 w-4 shrink-0 text-slate-300/70" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_28%),linear-gradient(135deg,_#f7fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-5 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
                  <Sparkles className="h-4 w-4" />
                  Personal Chat Archive
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {currentTitle}
                </h2>
              </div>
              <Link
                to="/"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                홈으로
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,_rgba(248,250,252,0.72)_0%,_rgba(255,255,255,1)_18%,_rgba(248,250,252,0.9)_100%)] px-4 py-6 md:px-8">
            {detailLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                {UI_TEXT.loadingDetail}
              </div>
            ) : detailError ? (
              <div className="flex h-full items-center justify-center">
                <p className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600">
                  {detailError}
                </p>
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,_#dbeafe_0%,_#eff6ff_100%)] text-blue-600 shadow-[0_20px_35px_rgba(59,130,246,0.18)]">
                    <Bot className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-slate-900">
                    {UI_TEXT.emptyThreadTitle}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {UI_TEXT.emptyThreadBody}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex max-w-4xl flex-col gap-4">
                {visibleMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      message.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[26px] px-5 py-4 shadow-sm ${
                        message.sender === "user"
                          ? "bg-[linear-gradient(135deg,_#1d4ed8_0%,_#2563eb_55%,_#38bdf8_100%)] text-white"
                          : "border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {message.text ||
                          (composer.isStreaming && message.sender === "bot"
                            ? "답변을 작성하는 중입니다..."
                            : "")}
                      </p>
                      {message.createdAt ? (
                        <p
                          className={`mt-2 text-[11px] ${
                            message.sender === "user"
                              ? "text-white/75"
                              : "text-slate-400"
                          }`}
                        >
                          {formatRelativeLabel(message.createdAt)}
                        </p>
                      ) : null}
                    </div>

                    {message.sender === "bot" &&
                    message.quickReplies?.length ? (
                      <div className="mt-2 flex max-w-[85%] flex-wrap gap-2">
                        {message.quickReplies.slice(0, 3).map((reply) => (
                          <Button
                            key={`${reply.label}-${reply.action.type}`}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            onClick={() => void handleQuickReplyClick(reply)}
                            disabled={composer.isStreaming}
                          >
                            {reply.label}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-4 md:px-8">
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-4xl items-end gap-3"
            >
              <textarea
                ref={inputRef}
                value={composer.value}
                onChange={(event) =>
                  setComposer((current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (!composer.isStreaming && composer.value.trim()) {
                      event.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
                rows={1}
                disabled={composer.isStreaming}
                placeholder={UI_TEXT.inputPlaceholder}
                className="max-h-40 min-h-[56px] flex-1 resize-y rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={composer.isStreaming || !composer.value.trim()}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_100%)] text-white shadow-[0_20px_35px_rgba(29,78,216,0.24)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
