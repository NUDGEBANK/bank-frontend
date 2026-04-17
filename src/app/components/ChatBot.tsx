import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { MessageCircle, Send, X } from "lucide-react";

import {
  getChatSession,
  getChatSessions,
  sendMessage,
  type ChatAction,
  type ChatMessageItem,
  type ChatSessionSummary,
} from "../api/chat";
import { useAuthStatus } from "../hooks/useAuthStatus";
import MessageMarkdown from "./MessageMarkdown";
import { Button } from "./ui/button";
import {CHAT_HISTORY_STORAGE_KEY, CHAT_SESSION_ID_STORAGE_KEY} from "../lib/chatStorage";

const FORCE_FRESH_CHATBOT_SESSION_KEY = "force_fresh_chatbot_session";

type Message = {
  text: string;
  sender: "user" | "bot";
  quickReplies?: ChatAction[];
};

function getInitialMessages(isAuthenticated: boolean): Message[] {
  if (!isAuthenticated) {
    return [
      {
        text: "안녕하세요.\nNUDGEBANK 금융 상담 AI입니다.\n로그인 후에 이용해주세요.",
        sender: "bot",
      },
    ];
  }

  return [
    {
      text:
          "안녕하세요.\nNUDGEBANK 금융 상담 AI입니다.\n무엇을 도와드릴까요?",
      sender: "bot",
    },
  ];
}

function buildFallbackQuickReplies(botText: string): ChatAction[] {
  const text = botText.toLowerCase();

  if (text.includes("대출")) {
    return [
      { type: "navigate", label: "대출 상품 보기", href: "/loan/products" },
      { type: "navigate", label: "신청 안내 보기", href: "/loan/apply-guide" },
      {
        type: "ask",
        label: "가능 여부 다시 묻기",
        value: "내가 받을 수 있는 대출이 뭐야?",
      },
    ];
  }

  if (text.includes("카드") || text.includes("소비")) {
    return [
      { type: "navigate", label: "똑개 카드 보기", href: "/card/ddokgae" },
      {
        type: "navigate",
        label: "소비 분석 보기",
        href: "/card/spending-analysis",
      },
      { type: "ask", label: "혜택 알려줘", value: "똑개 카드 혜택 알려줘" },
    ];
  }

  return [
    { type: "navigate", label: "대출 상품 보기", href: "/loan/products" },
    { type: "navigate", label: "상담 기록 보기", href: "/help/chat-history" },
    { type: "ask", label: "다시 질문하기", value: "추천 상품 알려줘" },
  ];
}

function mapSessionMessages(messages: ChatMessageItem[]): Message[] {
  return messages.map((message) => {
    const sender = message.sender_type === "USER" ? "user" : "bot";
    const text = message.message_content;

    return {
      text,
      sender,
      quickReplies:
          sender === "bot" ? buildFallbackQuickReplies(text) : undefined,
    };
  });
}

function getSessionSortTime(session: ChatSessionSummary): number {
  const value = session.updated_at ?? session.created_at;
  if (!value) return 0;

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default function ChatBot() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStatus();

  const isGuest = !isLoading && !isAuthenticated;

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    sessionStorage.getItem(CHAT_SESSION_ID_STORAGE_KEY),
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (saved) return JSON.parse(saved);

    return [
      {
        text: "안녕하세요.\nNUDGEBANK 금융 상담 AI입니다.\n무엇을 도와드릴까요?",
        sender: "bot",
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bufferRef = useRef("");
  const typingIntervalRef = useRef<number | null>(null);
  const streamDoneRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function syncLatestSession() {
      if (isLoading) return;

      setIsHistoryLoading(true);

      if (!isAuthenticated) {
        if (!isMounted) return;
        setInputValue("");
        setSessionId(null);
        setMessages(getInitialMessages(false));
        setIsHistoryLoading(false);
        return;
      }

      if (!isMounted) return;

      const shouldStartFresh =
          sessionStorage.getItem(FORCE_FRESH_CHATBOT_SESSION_KEY) === "true";

      if (shouldStartFresh) {
        sessionStorage.removeItem(FORCE_FRESH_CHATBOT_SESSION_KEY);
        setInputValue("");
        setSessionId(null);
        setMessages(getInitialMessages(true));
        setIsHistoryLoading(false);
        return;
      }

      try {
        const sessions = await getChatSessions();
        if (!isMounted) return;

        const latestSession = [...sessions].sort(
            (a, b) => getSessionSortTime(b) - getSessionSortTime(a),
        )[0];

        if (!latestSession) {
          setInputValue("");
          setSessionId(null);
          setMessages(getInitialMessages(true));
          return;
        }

        const detail = await getChatSession(latestSession.session_id);
        if (!isMounted) return;

        setSessionId(detail.session_id);
        setMessages(
            detail.messages.length
                ? mapSessionMessages(detail.messages)
                : getInitialMessages(true),
        );
      } catch (error) {
        if (!isMounted) return;

        console.error("최신 상담 기록 불러오기 실패:", error);
        setInputValue("");
        setSessionId(null);
        setMessages(getInitialMessages(true));
      } finally {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      }
    }

    void syncLatestSession();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isAuthenticated, isLoading]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isHistoryLoading]);

  useEffect(() => {
    if (!isOpen || isGuest || isHistoryLoading) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen, isGuest, isHistoryLoading]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current !== null) {
        window.clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const appendToLastBotMessage = (text: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const lastIndex = next.length - 1;

      if (lastIndex >= 0 && next[lastIndex].sender === "bot") {
        next[lastIndex] = {
          ...next[lastIndex],
          text: next[lastIndex].text + text,
        };
      }

      return next;
    });
  };

  const attachQuickRepliesToLastBotMessage = (quickReplies: ChatAction[]) => {
    setMessages((prev) => {
      const next = [...prev];
      const lastIndex = next.length - 1;

      if (lastIndex >= 0 && next[lastIndex].sender === "bot") {
        next[lastIndex] = {
          ...next[lastIndex],
          quickReplies,
        };
      }

      return next;
    });
  };

  const startTypingEffect = () => {
    if (typingIntervalRef.current !== null) return;

    typingIntervalRef.current = window.setInterval(() => {
      if (bufferRef.current.length > 0) {
        const nextChar = bufferRef.current[0];
        bufferRef.current = bufferRef.current.slice(1);
        appendToLastBotMessage(nextChar);
        return;
      }

      if (streamDoneRef.current) {
        if (typingIntervalRef.current !== null) {
          window.clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsStreaming(false);

        if (!isGuest && !isHistoryLoading) {
          requestAnimationFrame(() => inputRef.current?.focus());
        }
      }
    }, 20);
  };

  const submitMessage = async (rawMessage: string) => {
    if (isGuest || isHistoryLoading) return;

    const trimmed = rawMessage.trim();
    if (!trimmed || isStreaming) return;

    setInputValue("");
    setIsStreaming(true);
    bufferRef.current = "";
    streamDoneRef.current = false;

    setMessages((prev) => [
      ...prev,
      { text: trimmed, sender: "user" },
      { text: "", sender: "bot" },
    ]);

    startTypingEffect();

    try {
      const result = await sendMessage(
          "web-user",
          trimmed,
          (chunk) => {
            collectedChunks.push(chunk);
            bufferRef.current += chunk;
          },
          sessionId ?? undefined,
      );

      if (result.sessionId) {
        setSessionId(result.sessionId);
      }

      const finalBotText = collectedChunks.join("").trim();
      if (result.quickReplies && result.quickReplies.length > 0) {
        attachQuickRepliesToLastBotMessage(
            result.quickReplies?.length
                ? result.quickReplies
                : buildFallbackQuickReplies(finalBotText),
        );
    }

      streamDoneRef.current = true;
    } catch (error) {
      console.error("챗봇 API 호출 실패:", error);
      bufferRef.current += "죄송합니다. 잠시 후 다시 시도해주세요.";
      streamDoneRef.current = true;
    }
  };

  const handleQuickReplyClick = async (reply: ChatAction) => {
    if (reply.type === "navigate") {
      setIsOpen(false);
      navigate(reply.href);
      return;
    }

    if (isGuest || isHistoryLoading) return;
    await submitMessage(reply.value);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 rounded-full border border-white/20 bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] p-4 text-slate-800 shadow-2xl transition-all hover:from-[#c6dcf4] hover:to-[#b4d0f0] ${
          isOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-8 right-8 z-50 flex h-[560px] w-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] p-4 text-slate-800">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">NUDGEBOT</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition hover:bg-[#b4d0f0]/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f4f8fd] p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] text-slate-800"
                      : "border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {message.text ? (
                    <MessageMarkdown
                      content={message.text}
                      invert={message.sender === "user"}
                      disabledLinks={isStreaming}
                      onAskClick={
                        message.sender === "bot"
                          ? (nextMessage) => {
                              void submitMessage(nextMessage);
                            }
                          : undefined
                      }
                      onNavigateClick={
                        message.sender === "bot"
                          ? (href) => {
                              setIsOpen(false);
                              navigate(href);
                            }
                          : undefined
                      }
                    />
                  ) : message.sender === "bot" && isStreaming ? (
                    "응답 작성 중..."
                  ) : null}
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 transition hover:bg-[#b4d0f0]/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[#f4f8fd] p-4">
                {isHistoryLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      상담 기록을 불러오는 중...
                    </div>
                ) : (
                    <>
                      {messages.map((message, index) => (
                          <div
                              key={index}
                              className={`flex flex-col ${
                                  message.sender === "user" ? "items-end" : "items-start"
                              }`}
                          >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                    message.sender === "user"
                                        ? "bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] text-slate-800"
                                        : "border border-slate-200 bg-white text-slate-800"
                                }`}
                            >
                              {message.text ? (
                                  <MessageMarkdown
                                      content={message.text}
                                      invert={message.sender === "user"}
                                  />
                              ) : message.sender === "bot" && isStreaming ? (
                                  "응답 작성 중..."
                              ) : null}
                            </div>

                            {message.sender === "bot" && message.quickReplies?.length ? (
                                <div className="mt-2 flex max-w-[80%] flex-wrap gap-2">
                                  {message.quickReplies
                                  .slice(0, 3)
                                  .map((reply, replyIndex) => (
                                      <Button
                                          key={`${reply.label}-${replyIndex}`}
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="rounded-full border-[#c6dcf4] bg-[#f4f8fd] text-slate-700 hover:bg-[#eaf2fb]"
                                          onClick={() => void handleQuickReplyClick(reply)}
                                          disabled={isStreaming || isGuest || isHistoryLoading}
                                      >
                                        {reply.label}
                                      </Button>
                                  ))}
                                </div>
                            ) : null}
                          </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="flex items-end gap-2">
              <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (isGuest || isHistoryLoading) return;

                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitMessage(inputValue);
                    }
                  }}
                  placeholder={
                    isGuest
                        ? "로그인 후에 이용해주세요."
                        : isHistoryLoading
                            ? "상담 기록을 불러오는 중입니다..."
                            : "메시지를 입력하세요..."
                  }
                  disabled={isStreaming || isGuest || isHistoryLoading}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#dce9f8] disabled:bg-slate-100"
              />
                  <button
                      type="button"
                      onClick={() => void submitMessage(inputValue)}
                      disabled={
                          isStreaming || isGuest || isHistoryLoading || !inputValue.trim()
                      }
                      className="rounded-xl bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] p-3 text-slate-800 transition hover:from-[#c6dcf4] hover:to-[#b4d0f0] disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
        )}
      </>
  );
}
