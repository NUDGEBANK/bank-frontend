import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bot, MessageSquarePlus, Pencil, Send, Trash2 } from "lucide-react";

import {
  deleteChatSession,
  getChatSession,
  getChatSessions,
  renameChatSession,
  sendMessage,
  type ChatAction,
  type ChatMessageItem,
  type ChatSessionDetail,
  type ChatSessionSummary,
} from "../../api/chat";
import { useAuthStatus } from "../../hooks/useAuthStatus";
import MessageMarkdown from "../../components/MessageMarkdown";
import { Button } from "../../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";

type ComposerState = {
  value: string;
  isStreaming: boolean;
};

type ViewMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  createdAt: string | null;
  quickReplies?: ChatAction[];
};

type RenameDialogState = {
  open: boolean;
  session: ChatSessionSummary | null;
  value: string;
};

type DeleteDialogState = {
  open: boolean;
  session: ChatSessionSummary | null;
};

const UI_TEXT = {
  eyebrow: "NUDGEBOT",
  title: "상담 기록",
  subtitle: "이전 상담을 확인하고 이어서 질문할 수 있어요.",
  newChat: "새 상담 시작",
  emptyList: "아직 저장된 상담이 없습니다.",
  loadingList: "상담 목록을 불러오는 중입니다.",
  loadingDetail: "상담 내용을 불러오는 중입니다.",
  emptyThreadTitle: "새 상담을 시작해보세요",
  emptyThreadBody: "아래 입력창에 질문을 보내면 새 세션이 만들어집니다.",
  inputPlaceholder: "궁금한 금융 정보를 입력해보세요.",
  unauthorized: "로그인 후 채팅 기록을 확인할 수 있어요.",
  listError: "채팅 목록을 불러오지 못했습니다.",
  detailError: "선택한 상담을 불러오지 못했습니다.",
  streamingError: "응답을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.",
} as const;

function formatRelativeLabel(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function mapMessages(
    messages: ChatMessageItem[],
    liveQuickReplies: Record<string, ChatAction[]>,
): ViewMessage[] {
  return messages.map((message) => {
    const sender = message.sender_type === "USER" ? "user" : "bot";
    const text = message.message_content;
    const id = String(message.message_id);

    return {
      id,
      sender,
      text,
      createdAt: message.created_at,
      quickReplies:
          sender === "bot"
              ? (liveQuickReplies[id] ?? buildFallbackQuickReplies(text))
              : undefined,
    };
  });
}

export default function ChatHistory() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStatus();
  const isGuest = !authLoading && !isAuthenticated;

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
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    open: false,
    session: null,
    value: "",
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    session: null,
  });
  const [liveQuickReplies, setLiveQuickReplies] = useState<
      Record<string, ChatAction[]>
  >({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const visibleMessages = useMemo(
      () =>
          activeSession
              ? mapMessages(activeSession.messages, liveQuickReplies)
              : [],
      [activeSession, liveQuickReplies],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [visibleMessages, composer.isStreaming]);

  useEffect(() => {
    if (isGuest) return;

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isGuest]);

  useEffect(() => {
    if (composer.isStreaming || isGuest) return;

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [composer.isStreaming, activeSessionId, isGuest]);

  useEffect(() => {
    if (!renameDialog.open) return;

    const frameId = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [renameDialog.open]);

  useEffect(() => {
    if (authLoading) return;

    if (isGuest) {
      setSessions([]);
      setActiveSessionId(null);
      setActiveSession(null);
      setListLoading(false);
      setDetailLoading(false);
      setListError(UI_TEXT.unauthorized);
      setDetailError("");
      return;
    }

    let isMounted = true;

    async function loadSessions() {
      setListLoading(true);
      setListError("");

      try {
        const data = await getChatSessions();
        if (!isMounted) return;

        setSessions(data);
        setActiveSessionId((current) => current ?? data[0]?.session_id ?? null);
      } catch (error) {
        if (!isMounted) return;

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
  }, [authLoading, isGuest]);

  useEffect(() => {
    if (isGuest) {
      setActiveSession(null);
      setDetailError("");
      setDetailLoading(false);
      return;
    }

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
        if (!isMounted) return;
        setActiveSession(data);
      } catch (error) {
        if (!isMounted) return;

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
  }, [activeSessionId, isGuest]);

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
    if (isGuest) return;

    const trimmed = rawMessage.trim();
    if (!trimmed || composer.isStreaming) return;

    const draftSessionId = activeSessionId;
    const draftTitle = activeSession?.title ?? trimmed;
    const userMessageId = Date.now();
    const botMessageId = String(userMessageId + 1);

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
          message_id: userMessageId,
          sender_type: "USER",
          message_content: trimmed,
          created_at: new Date().toISOString(),
        },
        {
          message_id: Number(botMessageId),
          sender_type: "BOT",
          message_content: "",
          created_at: new Date().toISOString(),
        },
      ],
    }));

    try {
      const result = await sendMessage(
          "web-user",
          trimmed,
          (chunk) => {
            collectedChunks.push(chunk);

            setActiveSession((current) => {
              if (!current) return current;

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

    if (result.quickReplies.length > 0) {
        setLiveQuickReplies((current) => ({
        ...current,
        [botMessageId]:
            result.quickReplies?.length
                ? result.quickReplies
                : buildFallbackQuickReplies(collectedChunks.join(" ").trim()),
      }));
    }

      await refreshSessions(result.sessionId ?? draftSessionId ?? null);
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

  const handleQuickReplyClick = async (reply: ChatAction) => {
    if (reply.type === "navigate") {
      navigate(reply.href);
      return;
    }

    if (isGuest) return;
    await submitMessage(reply.value);
  };

  function closeRenameDialog() {
    setRenameDialog({
      open: false,
      session: null,
      value: "",
    });
  }

  async function handleRenameSession() {
    const session = renameDialog.session;
    if (!session || isGuest) return;

    const trimmedTitle = renameDialog.value.trim();
    if (!trimmedTitle || trimmedTitle === session.title) {
      closeRenameDialog();
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
      closeRenameDialog();
    } catch (error) {
      console.error(error);
      setListError("채팅 이름을 변경하지 못했습니다.");
    } finally {
      setPendingActionSessionId(null);
    }
  }

  async function handleDeleteSession() {
    const session = deleteDialog.session;
    if (!session || isGuest) return;

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

      setDeleteDialog({
        open: false,
        session: null,
      });
    } catch (error) {
      console.error(error);
      setListError("채팅을 삭제하지 못했습니다.");
    } finally {
      setPendingActionSessionId(null);
    }
  }

  const currentTitle = activeSession?.title ?? "NUDGEBOT";

  return (
      <div className="min-h-[calc(100vh-88px)] bg-[#f8fbff]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-6 lg:h-[calc(100vh-88px)] lg:flex-row lg:overflow-hidden lg:py-8">
          <aside className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-900 shadow-sm lg:w-[320px] lg:shrink-0">
            <div className="border-b border-slate-200 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#dce9f8] p-2 text-[#5f7c9d]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7f9bb8]">
                    {UI_TEXT.eyebrow}
                  </p>
                  <h1 className="mt-1 text-xl font-semibold text-slate-900">
                    {UI_TEXT.title}
                  </h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {UI_TEXT.subtitle}
              </p>
              <button
                  type="button"
                  onClick={() => {
                    if (isGuest) return;
                    setActiveSessionId(null);
                    setActiveSession(null);
                    setDetailError("");
                  }}
                  disabled={isGuest}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#dce9f8] px-4 py-3 text-sm font-semibold text-[#2a4b78] transition hover:bg-[#cddff4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageSquarePlus className="h-4 w-4" />
                {UI_TEXT.newChat}
              </button>
            </div>

            <div className="max-h-[48vh] overflow-y-auto px-3 py-3 lg:h-[calc(100%-210px)] lg:max-h-none">
              {listLoading ? (
                  <p className="px-3 py-4 text-sm text-slate-500">
                    {UI_TEXT.loadingList}
                  </p>
              ) : listError ? (
                  <p className="px-3 py-4 text-sm text-rose-500">{listError}</p>
              ) : sessions.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-slate-500">
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
                                      ? "border-slate-300 bg-slate-50"
                                      : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <button
                                  type="button"
                                  onClick={() => setActiveSessionId(session.session_id)}
                                  className="flex-1 text-left"
                                  disabled={isGuest}
                              >
                                <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                                  {session.title}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                  {formatRelativeLabel(
                                      session.updated_at ?? session.created_at,
                                  )}
                                </p>
                              </button>
                              <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={
                                        isGuest ||
                                        pendingActionSessionId === session.session_id
                                    }
                                    onClick={() => {
                                      setRenameDialog({
                                        open: true,
                                        session,
                                        value: session.title,
                                      });
                                    }}
                                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#2a4b78] disabled:opacity-40"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        isGuest ||
                                        pendingActionSessionId === session.session_id
                                    }
                                    onClick={() => {
                                      setDeleteDialog({
                                        open: true,
                                        session,
                                      });
                                    }}
                                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                      );
                    })}
                  </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-white px-6 py-5 md:px-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {currentTitle}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#fafcff] px-4 py-6 md:px-8">
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
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-100 text-[#2a4b78]">
                        <Bot className="h-8 w-8" />
                      </div>
                      <h3 className="mt-6 text-2xl font-semibold text-slate-900">
                        {isGuest ? "로그인 후 이용해주세요" : UI_TEXT.emptyThreadTitle}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {isGuest ? UI_TEXT.unauthorized : UI_TEXT.emptyThreadBody}
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
                              className={`max-w-[85%] px-5 py-4 md:max-w-[78%] ${
                                  message.sender === "user"
                                      ? "min-w-[240px] rounded-[22px] rounded-tr-[8px] bg-[#eaf2fb] text-[#1f3654]"
                                      : "rounded-[24px] border border-slate-200 bg-white text-slate-800"
                              }`}
                          >
                            {message.text ? (
                                <MessageMarkdown
                                    content={message.text}
                                    invert={message.sender === "user"}
                                />
                            ) : composer.isStreaming && message.sender === "bot" ? (
                                <p className="text-sm leading-7 text-slate-600">
                                  응답 작성 중입니다...
                                </p>
                            ) : null}

                            {message.createdAt ? (
                                <p
                                    className={`mt-2 text-[11px] ${
                                        message.sender === "user"
                                            ? "text-[#6b85a5]"
                                            : "text-slate-500"
                                    }`}
                                >
                                  {formatRelativeLabel(message.createdAt)}
                                </p>
                            ) : null}
                          </div>

                          {message.sender === "bot" &&
                          message.quickReplies?.length ? (
                              <div className="mt-2 flex max-w-[85%] flex-wrap gap-2">
                                {message.quickReplies
                                .slice(0, 3)
                                .map((reply, replyIndex) => (
                                    <Button
                                        key={`${reply.label}-${replyIndex}`}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full border-[#d6e2f0] bg-[#f8fbff] text-[#48627f] hover:bg-[#eef4fb] hover:text-[#2a4b78]"
                                        onClick={() => void handleQuickReplyClick(reply)}
                                        disabled={composer.isStreaming || isGuest}
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

            <div className="border-t border-slate-200 bg-white px-4 py-4 md:px-8">
              <form
                  onSubmit={handleSubmit}
                  className="mx-auto flex max-w-4xl items-end gap-3 rounded-[24px] border border-slate-200 bg-white px-3 py-2.5 transition focus-within:border-[#bfd3eb] focus-within:ring-2 focus-within:ring-[#e8f1fb]"
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
                    if (isGuest) return;

                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (!composer.isStreaming && composer.value.trim()) {
                        event.currentTarget.form?.requestSubmit();
                      }
                    }
                  }}
                  rows={1}
                  disabled={composer.isStreaming || isGuest}
                  placeholder={
                    isGuest
                        ? "로그인 후에 이용해주세요."
                        : UI_TEXT.inputPlaceholder
                  }
                  className="max-h-40 min-h-[48px] flex-1 resize-none rounded-[18px] border border-transparent bg-transparent px-5 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
                <button
                    type="submit"
                    disabled={
                        composer.isStreaming || isGuest || !composer.value.trim()
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c7d7e8] text-[#5f7c9d] transition hover:bg-[#b7cade] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </section>
        </div>

        <Dialog
            open={renameDialog.open}
            onOpenChange={(open) => {
              if (!open) {
                closeRenameDialog();
              }
            }}
        >
          <DialogContent className="max-w-md rounded-[24px] border border-slate-200 bg-white p-0 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
            <DialogHeader className="gap-3 border-b border-slate-100 px-6 py-5 text-left">
              <DialogTitle className="text-[18px] font-semibold text-slate-900">
                채팅 이름 변경
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-slate-500">
                구분하기 쉬운 이름으로 바꿔보세요.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-5">
              <Input
                  ref={renameInputRef}
                  value={renameDialog.value}
                  maxLength={60}
                  onChange={(event) =>
                      setRenameDialog((current) => ({
                        ...current,
                        value: event.target.value,
                      }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleRenameSession();
                    }
                  }}
                  placeholder="채팅 이름을 입력하세요."
                  className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-900"
              />
            </div>

            <DialogFooter className="border-t border-slate-100 px-6 py-4 sm:justify-between">
              <Button type="button" variant="outline" onClick={closeRenameDialog}>
                취소
              </Button>
              <Button
                  type="button"
                  onClick={() => void handleRenameSession()}
                  disabled={
                      isGuest ||
                      !renameDialog.session ||
                      !renameDialog.value.trim() ||
                      pendingActionSessionId === renameDialog.session.session_id
                  }
                  className="bg-[#dce9f8] text-[#2a4b78] hover:bg-[#cddff4]"
              >
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
            open={deleteDialog.open}
            onOpenChange={(open) => {
              if (!open) {
                setDeleteDialog({ open: false, session: null });
              }
            }}
        >
          <AlertDialogContent className="max-w-md rounded-[24px] border border-slate-200 bg-white p-0 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
            <AlertDialogHeader className="gap-3 border-b border-slate-100 px-6 py-5 text-left">
              <AlertDialogTitle className="text-[18px] font-semibold text-slate-900">
                채팅 삭제
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-slate-500">
                {deleteDialog.session
                    ? `"${deleteDialog.session.title}" 상담을 삭제할까요?`
                    : "이 상담을 삭제할까요?"}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="border-t border-slate-100 px-6 py-4 sm:justify-between">
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                  onClick={() => void handleDeleteSession()}
                  className="bg-rose-500 text-white hover:bg-rose-600"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
