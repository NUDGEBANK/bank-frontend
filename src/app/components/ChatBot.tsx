import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { sendMessage } from "../api/chat";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";

type QuickReplyAction =
  | {
      type: "ask"; // 재질문 전송
      value: string;
    }
  | {
      type: "navigate"; // 특정 화면 이동
      href: string;
    };

type QuickReply = {
  label: string;
  action: QuickReplyAction;
};

type Message = {
  text: string;
  sender: "user" | "bot";
  quickReplies?: QuickReply[];
};

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
    if (saved) {
      return JSON.parse(saved) as Message[];
    }

    return [
      {
        text: "안녕하세요! \nNUDGEBANK 금융 상담 AI입니다. \n무엇을 도와드릴까요?",
        sender: "bot",
        quickReplies: DEFAULT_LOAN_QUICK_REPLIES,
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
      attachQuickRepliesToLastBotMessage(DEFAULT_LOAN_QUICK_REPLIES);
      streamDoneRef.current = true;
    }
  };

  const handleSend = async () => {
    await submitMessage(inputValue);
  };

  // 챗봇 버튼 클릭 시 재질문 또는 이동
  const handleQuickReplyClick = async (reply: QuickReply) => {
    if (reply.action.type === "ask") {
      await submitMessage(reply.action.value);
      return;
    }

    setIsOpen(false);
    navigate(reply.action.href);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 rounded-full border border-white/20 bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-2xl transition-all backdrop-blur-sm hover:from-blue-700 hover:to-blue-800 ${
          isOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-8 right-8 z-50 flex h-[500px] w-96 flex-col rounded-lg border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">NUDGEBOT</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-blue-800/50"
            >
              <X className="h-5 w-5" />
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
                  className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "border border-gray-200 bg-white/80 text-gray-800 backdrop-blur-sm"
                  }`}
                >
                  {message.text ||
                    (message.sender === "bot" && isStreaming
                      ? "답변 작성 중..."
                      : "")}
                </div>

                {message.sender === "bot" && message.quickReplies?.length ? (
                  <div className="mt-2 flex max-w-[80%] flex-wrap gap-2">
                    {message.quickReplies.slice(0, 3).map((reply) => (
                      <Button
                        key={`${reply.label}-${reply.action.type}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
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
                className="flex-1 resize-none rounded-lg border border-gray-300 bg-white/90 px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
              />
              <button
                onClick={() => void handleSend()}
                disabled={isStreaming}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-2 text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
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
