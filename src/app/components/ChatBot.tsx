import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";

// 메시지 타입 정의 (타입스크립트를 사용하신다면 유용합니다)
type Message = {
  text: string;
  sender: "user" | "bot";
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  // 스크롤을 맨 아래로 내리기 위한 참조값
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 상태 초기화: 세션 스토리지에서 이전 대화를 불러옵니다. (PostgreSQL 연동 전 임시/보조 저장소 역할)
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem("chat_history");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { text: "안녕하세요! 똑개뱅크 AI 상담사입니다. 무엇을 도와드릴까요?", sender: "bot" },
    ];
  });

  // 2. 상태 저장: 메시지가 업데이트될 때마다 세션 스토리지에 동기화합니다.
  useEffect(() => {
    sessionStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  // 3. PostgreSQL 데이터 불러오기 시뮬레이션 (향후 여기에 API 연동)
  useEffect(() => {
    // 컴포넌트가 처음 마운트될 때 DB에서 이전 세션 기록을 가져오는 로직이 들어갈 자리입니다.
    /*
    const fetchHistoryFromDB = async () => {
      const response = await fetch('/api/chat/history');
      const data = await response.json();
      setMessages(data);
    };
    fetchHistoryFromDB();
    */
  }, []);

  // 4. 자동 스크롤: 메시지가 추가되거나 창이 열릴 때 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    setMessages((prev) => [...prev, { text: inputValue, sender: "user" }]);
    setInputValue("");

    // 간단한 자동 응답 (향후 FastAPI 연동 자리)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "문의하신 내용을 확인했습니다. 곧 상담사가 연결됩니다.", sender: "bot" },
      ]);
    }, 1000);
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-2xl transition-all backdrop-blur-sm border border-white/20 ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* 챗봇 창 */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-96 h-[500px] bg-white/95 backdrop-blur-md rounded-lg shadow-2xl flex flex-col z-50 border border-white/20">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">AI 상담</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-800/50 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {/* 자동 스크롤을 위한 빈 요소 */}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="p-4 border-t border-white/20 bg-white/50 backdrop-blur-sm">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-2 rounded-lg transition-all shadow-md"
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