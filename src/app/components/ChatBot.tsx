import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { MessageCircle, Send, X } from "lucide-react";

import { sendMessage, type ChatAction } from "../api/chat";
import { useAuthStatus } from "../hooks/useAuthStatus";
import {
  CHAT_HISTORY_STORAGE_KEY,
  CHAT_SESSION_ID_STORAGE_KEY,
} from "../lib/chatStorage";
import MessageMarkdown from "./MessageMarkdown";
import { Button } from "./ui/button";

type Message = {
  text: string;
  sender: "user" | "bot";
  quickReplies?: ChatAction[];
};

function getInitialMessages(isAuthenticated: boolean): Message[] | undefined {
  if (!isAuthenticated) {
    return [
      {
        text: "안녕하세요.\nNUDGEBANK 금융 상담 AI입니다.\n로그인 후에 이용해주세요.",
        sender: "bot",
      },
    ];
  }
}

export default function ChatBot() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStatus();

  // 비로그인 상태를 따로 계산해서 입력/전송 차단에 사용
  const isGuest = !isLoading && !isAuthenticated;

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
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
    if (isLoading) return;

    if (!isAuthenticated) {
      setMessages(getInitialMessages(false) ?? []);
      return;
    }

    const saved = sessionStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (saved) {
      setMessages(JSON.parse(saved));
      return;
    }

    setMessages(getInitialMessages(true) ?? []);
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    sessionStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem(CHAT_SESSION_ID_STORAGE_KEY, sessionId);
      return;
    }
    sessionStorage.removeItem(CHAT_SESSION_ID_STORAGE_KEY);
  }, [sessionId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    // 비로그인 상태에서는 입력창 포커스를 주지 않음
    if (!isOpen || isGuest) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen, isGuest]);

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

        // 비로그인 상태에서는 응답 후에도 입력창 포커스를 주지 않음
        if (!isGuest) {
          requestAnimationFrame(() => inputRef.current?.focus());
        }
      }
    }, 20);
  };

  const submitMessage = async (rawMessage: string) => {
    // 비로그인 상태면 아예 전송 함수 진입 차단
    if (isGuest) return;

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
        trimmed,
        (chunk) => {
          bufferRef.current += chunk;
        },
        sessionId ?? undefined,
      );

      if (result.sessionId) {
        setSessionId(result.sessionId);
      }

      if (result.quickReplies && result.quickReplies.length > 0) {
        attachQuickRepliesToLastBotMessage(result.quickReplies);
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

    // 비로그인 상태에서는 quick reply 질문도 막음
    if (isGuest) return;

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
                          // 비로그인 상태에서는 quick reply 버튼도 비활성화
                          disabled={isStreaming || isGuest}
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

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  // 비로그인 상태에서는 엔터 입력 전송도 막음
                  if (isGuest) return;

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submitMessage(inputValue);
                  }
                }}
                // 비로그인 상태일 때 안내용 placeholder 표시
                placeholder={
                  isGuest
                    ? "로그인 후에 이용해주세요."
                    : "메시지를 입력하세요..."
                }
                // 비로그인 상태에서는 입력창 자체를 비활성화
                disabled={isStreaming || isGuest}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#dce9f8] disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => void submitMessage(inputValue)}
                // 비로그인 상태에서는 전송 버튼도 비활성화
                disabled={isStreaming || isGuest || !inputValue.trim()}
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
