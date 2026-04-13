import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useNavigate } from "react-router";
import { sendMessage } from "../api/chat";

type Message = {
  text: string;
  sender: "user" | "bot";
};

export default function ChatBot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem("chat_session_id"));
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
        text: "안녕하세요! \nNUDGEBANK 금융 상담 AI입니다. \n무엇을 도와드릴까요?",
        sender: "bot",
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

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = inputValue.trim();
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
      const nextSessionId = await sendMessage("user-123", userMessage, (chunk) => {
        bufferRef.current += chunk;
      }, sessionId ?? undefined);

      if (nextSessionId) {
        setSessionId(nextSessionId);
      }

      streamDoneRef.current = true;
    } catch (error) {
      console.error("챗봇 API 호출 실패:", error);
      bufferRef.current +=
        "챗봇 서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-2xl transition-all backdrop-blur-sm border border-white/20 ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-8 right-8 z-50 flex h-[560px] w-96 flex-col rounded-lg border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">NUDGEBOT</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-800/50 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
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

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg whitespace-pre-wrap ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200"
                  }`}
                >
                  {message.text ||
                    (message.sender === "bot" && isStreaming
                      ? "답변 작성 중..."
                      : "")}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/20 bg-white/50 backdrop-blur-sm">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="메시지를 입력하세요..."
                disabled={isStreaming}
                rows={1}
                className="flex-1 resize-none px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
              />
              <button
                onClick={handleSend}
                disabled={isStreaming}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-2 rounded-lg transition-all shadow-md disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
