import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { sendMessage, type ChatAction } from "../api/chat";
import { Button } from "./ui/button";
import MessageMarkdown from "./MessageMarkdown";

type QuickReply = ChatAction;
import { useNavigate } from "react-router";

type Message = {
  text: string;
  sender: "user" | "bot";
  quickReplies?: QuickReply[];
};

function buildQuickReplies(botText: string): QuickReply[] {
  const text = botText.toLowerCase();

  // 상품 조회 단계
  if (
    text.includes("받을 수 있는 대출") ||
    text.includes("추천") ||
    text.includes("상품")
  ) {
    return [
      {
        type: "ask",
        label: "상품 설명 보기",
        value: "이 상품 설명 자세히 보여줘",
      },
      { type: "ask", label: "가능 여부 조회", value: "이 상품이 나한테 맞아?" },
      {
        type: "ask",
        label: "신청 안내 보기",
        value: "신청하려면 뭐가 필요해?",
      },
    ];
  }

  // 상품 설명 단계
  if (text.includes("금리") || text.includes("기간") || text.includes("상환")) {
    return [
      { type: "ask", label: "가능 여부 조회", value: "이 상품이 나한테 맞아?" },
      { type: "ask", label: "심사 기준 보기", value: "심사 기준이 뭐야?" },
      {
        type: "ask",
        label: "신청 안내 보기",
        value: "신청하려면 뭐가 필요해?",
      },
    ];
  }

  // 가능 여부 단계
  if (text.includes("가능") || text.includes("대상") || text.includes("조건")) {
    return [
      { type: "ask", label: "내 한도 보기", value: "내 한도는 어느 정도야?" },
      { type: "ask", label: "심사 기준 보기", value: "심사 기준이 뭐야?" },
      { type: "ask", label: "신청 안내 보기", value: "신청은 어디서 해?" },
    ];
  }

  // 신청 안내 단계
  if (
    text.includes("서류") ||
    text.includes("신청") ||
    text.includes("어디서")
  ) {
    return [
      {
        type: "ask",
        label: "필요 서류 다시 보기",
        value: "신청하려면 뭐가 필요해?",
      },
      { type: "ask", label: "심사 기준 보기", value: "심사 기준이 뭐야?" },
      {
        type: "navigate",
        label: "신청 페이지 이동",
        href: "/loan/apply-guide",
      },
    ];
  }

  // 기본 버튼
  return [
    {
      type: "ask",
      label: "대출 상품 보기",
      value: "내가 받을 수 있는 대출 뭐 있어?",
    },
    { type: "ask", label: "가능 여부 조회", value: "이 상품이 나한테 맞아?" },
    { type: "ask", label: "신청 안내 보기", value: "신청하려면 뭐가 필요해?" },
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bufferRef = useRef<string>("");
  const typingIntervalRef = useRef<number | null>(null);
  const streamDoneRef = useRef<boolean>(false);

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem("chat_history");
    if (saved) return JSON.parse(saved);

    return [
      {
        text: "안녕하세요!\nNUDGEBANK 금융 상담 AI입니다.\n무엇을 도와드릴까요?",
        sender: "bot",
        quickReplies: [
          // 첫 진입 버튼
          {
            type: "ask",
            label: "대출 상품 보기",
            value: "내가 받을 수 있는 대출 뭐 있어?",
          },
          {
            type: "ask",
            label: "가능 여부 조회",
            value: "이 상품이 나한테 맞아?",
          },
          {
            type: "ask",
            label: "신청 안내 보기",
            value: "신청하려면 뭐가 필요해?",
          },
        ],
      },
    ];
  });

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

    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

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
      const updated = [...prev];
      const lastIndex = updated.length - 1;

      if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
        updated[lastIndex] = {
          ...updated[lastIndex],
          text: updated[lastIndex].text + text,
        };
      }

      return updated;
    });
  };

  // 챗봇 버튼
  const attachQuickRepliesToLastBotMessage = (quickReplies: QuickReply[]) => {
    setMessages((prev) => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;

      if (lastIndex >= 0 && updated[lastIndex].sender === "bot") {
        updated[lastIndex] = {
          ...updated[lastIndex],
          quickReplies,
        };
      }

      return updated;
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

        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    }, 20);
  };

  // 챗봇 API 호출 및 메시지 처리
  const submitMessage = async (rawMessage: string) => {
    if (!rawMessage.trim() || isStreaming) return;

    const userMessage = rawMessage.trim();
    setInputValue("");
    setIsStreaming(true);

    bufferRef.current = "";
    streamDoneRef.current = false;

    setMessages((prev) => [
      ...prev,
      { text: userMessage, sender: "user" },
      { text: "", sender: "bot" },
    ]);

    startTypingEffect();

    try {
      const collectedChunks: string[] = [];

      const nextSessionId = await sendMessage(
        "user-123",
        userMessage,
        (chunk) => {
          collectedChunks.push(chunk);
          bufferRef.current += chunk;
        },
        sessionId ?? undefined,
      );

      if (nextSessionId) {
        setSessionId(nextSessionId);
      }

      const finalBotText = collectedChunks.join("").trim();
      attachQuickRepliesToLastBotMessage(buildQuickReplies(finalBotText));

      streamDoneRef.current = true;
    } catch (error) {
      console.error("챗봇 API 호출 실패:", error);
      bufferRef.current +=
        "챗봇 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
      attachQuickRepliesToLastBotMessage([
        { type: "ask", label: "다시 질문하기", value: rawMessage },
        {
          type: "ask",
          label: "대출 상품 보기",
          value: "내가 받을 수 있는 대출 뭐 있어?",
        },
        { type: "navigate", label: "대출 상품 보기", href: "/loan/products" },
        {
          type: "navigate",
          label: "신청 안내 보기",
          href: "/loan/apply-guide",
        },
      ]);
      streamDoneRef.current = true;
    }
  };

  const handleMoveToGuide = () => {
    // 챗봇 UI에서 대출 신청 안내 페이지로 이동
    setIsOpen(false);
    navigate("/loan/apply-guide");
  };

  const handleMoveToChatHistory = () => {
    // 챗봇 UI에서 전체 상담 화면으로 이동
    setIsOpen(false);
    navigate("/help/chat-history");
  };

  const handleSend = async () => {
    await submitMessage(inputValue);
  };

  const handleQuickReplyClick = async (reply: QuickReply) => {
    // 재질문 또는 화면 이동 분기
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
        className={`fixed bottom-8 right-8 rounded-full border border-white/20 bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] p-4 text-slate-800 shadow-2xl transition-all backdrop-blur-sm hover:from-[#c6dcf4] hover:to-[#b0cff0] ${
          isOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-8 right-8 z-50 flex h-[560px] w-96 flex-col rounded-lg border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] p-4 text-slate-800">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">NUDGEBOT</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-[#b0cff0]/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 버튼 3개로 변경 필요 */}
          <div className="flex gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <button
              type="button"
              onClick={handleMoveToGuide}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              대출 신청 안내
            </button>
            <button
              type="button"
              onClick={handleMoveToChatHistory}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              상담 기록 보기
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] text-slate-800 shadow-md"
                      : "border border-gray-200 bg-white/80 text-gray-800 backdrop-blur-sm"
                  }`}
                >
                  {message.text ? (
                    <MessageMarkdown
                      content={message.text}
                      invert={message.sender === "user"}
                    />
                  ) : message.sender === "bot" && isStreaming ? (
                    "답변 작성 중..."
                  ) : (
                    ""
                  )}
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

          <div className="border-t border-white/20 bg-white/50 p-4 backdrop-blur-sm">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="메시지를 입력하세요..."
                disabled={isStreaming}
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-300 bg-white/90 px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#dce9f8] disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isStreaming}
                className="rounded-lg bg-gradient-to-r from-[#dce9f8] to-[#c6dcf4] p-2 text-slate-800 shadow-md transition-all hover:from-[#c6dcf4] hover:to-[#b0cff0] disabled:opacity-50"
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
