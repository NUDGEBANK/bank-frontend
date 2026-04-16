import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { MessageCircle, Send, X } from "lucide-react";

import { sendMessage, type ChatAction } from "../api/chat";
import MessageMarkdown from "./MessageMarkdown";
import { Button } from "./ui/button";

type Message = {
  text: string;
  sender: "user" | "bot";
  quickReplies?: ChatAction[];
};

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

export default function ChatBot() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    sessionStorage.getItem("chat_session_id"),
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem("chat_history");
    if (saved) return JSON.parse(saved);

    return [
      {
        text: "안녕하세요.\nNUDGEBANK 금융 상담 AI입니다.\n무엇을 도와드릴까요?",
        sender: "bot",
        quickReplies: [
          { type: "navigate", label: "대출 상품 보기", href: "/loan/products" },
          {
            type: "navigate",
            label: "상담 기록 보기",
            href: "/help/chat-history",
          },
          {
            type: "ask",
            label: "추천 상품 알려줘",
            value: "내게 맞는 금융 상품 추천해줘",
          },
        ],
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bufferRef = useRef("");
  const typingIntervalRef = useRef<number | null>(null);
  const streamDoneRef = useRef(false);

  useEffect(() => {
    sessionStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem("chat_session_id", sessionId);
      return;
    }
    sessionStorage.removeItem("chat_session_id");
  }, [sessionId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

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
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, 20);
  };

  const submitMessage = async (rawMessage: string) => {
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
      const collectedChunks: string[] = [];

      const result = await sendMessage(
        "user-123",
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
      attachQuickRepliesToLastBotMessage(
        result.quickReplies.length
          ? result.quickReplies
          : buildFallbackQuickReplies(finalBotText),
      );

      streamDoneRef.current = true;
    } catch (error) {
      console.error("챗봇 API 호출 실패:", error);
      bufferRef.current += "죄송합니다. 잠시 후 다시 시도해주세요.";
      attachQuickRepliesToLastBotMessage([
        { type: "ask", label: "다시 질문하기", value: trimmed },
        { type: "navigate", label: "대출 상품 보기", href: "/loan/products" },
        {
          type: "navigate",
<<<<<<< HEAD
          label: "신청 안내 보기",
          href: "/loan/apply-guide",
=======
          label: "상담 기록 보기",
          href: "/help/chat-history",
>>>>>>> a1a70f0d045410625226b6d4e3853f0dd56890e8
        },
      ]);
      streamDoneRef.current = true;
    }
  };

  const handleQuickReplyClick = async (reply: ChatAction) => {
    if (reply.type === "navigate") {
      setIsOpen(false);
      navigate(reply.href);
      return;
    }

    await submitMessage(reply.value);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
<<<<<<< HEAD
        className={`fixed bottom-8 right-8 rounded-full border border-white/20 bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] p-4 text-slate-800 shadow-2xl transition-all backdrop-blur-sm hover:from-[#c6dcf4] hover:to-[#b0cff0] ${
=======
        className={`fixed bottom-8 right-8 rounded-full border border-white/20 bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-2xl transition-all hover:from-blue-700 hover:to-blue-800 ${
>>>>>>> a1a70f0d045410625226b6d4e3853f0dd56890e8
          isOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
<<<<<<< HEAD
        <div className="fixed bottom-8 right-8 z-50 flex h-[560px] w-96 flex-col rounded-lg border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] p-4 text-slate-800">
=======
        <div className="fixed bottom-8 right-8 z-50 flex h-[560px] w-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
>>>>>>> a1a70f0d045410625226b6d4e3853f0dd56890e8
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">NUDGEBOT</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
<<<<<<< HEAD
              className="rounded-full p-1 transition-colors hover:bg-[#b0cff0]/50"
=======
              className="rounded-full p-1 transition hover:bg-blue-800/50"
>>>>>>> a1a70f0d045410625226b6d4e3853f0dd56890e8
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafcff] p-4">
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
<<<<<<< HEAD
                      ? "bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] text-slate-800 shadow-md"
                      : "border border-gray-200 bg-white/80 text-gray-800 backdrop-blur-sm"
=======
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                      : "border border-slate-200 bg-white text-slate-800"
>>>>>>> a1a70f0d045410625226b6d4e3853f0dd56890e8
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
                          disabled={isStreaming}
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
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submitMessage(inputValue);
                  }
                }}
                placeholder="메시지를 입력하세요..."
                disabled={isStreaming}
                rows={1}
<<<<<<< HEAD
                className="flex-1 resize-none rounded-lg border border-gray-300 bg-white/90 px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#dce9f8] disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isStreaming}
                className="rounded-lg bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] p-2 text-slate-800 shadow-md transition-all hover:from-[#c6dcf4] hover:to-[#b0cff0] disabled:opacity-50"
=======
                className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => void submitMessage(inputValue)}
                disabled={isStreaming || !inputValue.trim()}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-white transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
>>>>>>> a1a70f0d045410625226b6d4e3853f0dd56890e8
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
