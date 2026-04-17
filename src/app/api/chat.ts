export interface ChatRequest {
  message: string;
  session_id?: string;
}

export type ChatAction =
  | {
      type: "ask";
      label: string;
      value: string;
    }
  | {
      type: "navigate";
      label: string;
      href: string;
    };

export interface ChatSessionSummary {
  session_id: string;
  title: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatMessageItem {
  message_id: number;
  sender_type: "USER" | "BOT";
  message_content: string;
  created_at: string | null;
}

export interface ChatSessionDetail {
  session_id: string;
  title: string;
  created_at: string | null;
  updated_at: string | null;
  messages: ChatMessageItem[];
}

// 반환 타입을 sessionId와 quickReplies를 모두 포함하는 객체로 변경했습니다.
export async function sendMessage(
  message: string,
  onChunk: (chunk: string) => void,
  sessionId?: string,
): Promise<{ sessionId: string | null; quickReplies: ChatAction[] }> {
  const response = await fetch("/chat-api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      message,
      session_id: sessionId,
    } as ChatRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "챗봇 API 호출에 실패했습니다.");
  }

  if (!response.body) {
    throw new Error("스트리밍 응답 본문이 없습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  const nextSessionId = response.headers.get("X-Chat-Session-Id");

  let buffer = "";
  let finalQuickReplies: ChatAction[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 받아온 chunk를 버퍼에 추가
    buffer += decoder.decode(value, { stream: true });
    
    // SSE는 \n\n 으로 이벤트 단위가 끝납니다.
    const parts = buffer.split('\n\n');
    
    // 마지막 요소는 아직 불완전한 청크일 수 있으므로 버퍼에 남겨둡니다.
    buffer = parts.pop() || "";

    for (const part of parts) {
      if (!part.trim()) continue;

      const lines = part.split('\n');
      let eventType = "";
      let dataStr = "";

      // 각 줄에서 event와 data 추출
      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.replace("event:", "").trim();
        } else if (line.startsWith("data:")) {
          dataStr = line.replace("data:", "").trim();
        }
      }

      if (dataStr) {
        try {
          const data = JSON.parse(dataStr);

          if (eventType === "chunk" && data.text) {
            // 일반 텍스트 스트리밍
            onChunk(data.text);
          } else if (eventType === "done") {
            // 스트리밍 종료 및 퀵 리플라이 수신
            if (Array.isArray(data.quickReplies)) {
              finalQuickReplies = data.quickReplies;
            }
          } else if (eventType === "error") {
            console.error("서버 에러:", data.message);
          }
        } catch (e) {
          console.error("JSON 파싱 에러:", e, "원본 데이터:", dataStr);
        }
      }
    }
  }

  return { sessionId: nextSessionId, quickReplies: finalQuickReplies };
}

export async function getChatSessions(): Promise<ChatSessionSummary[]> {
  const response = await fetch("/chat-api/chat/sessions", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "채팅 목록을 불러오지 못했습니다.");
  }

  return response.json();
}

export async function getChatSession(sessionId: string,
): Promise<ChatSessionDetail> {
  const response = await fetch(`/chat-api/chat/sessions/${sessionId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "채팅 내용을 불러오지 못했습니다.");
  }

  return response.json();
}

export async function renameChatSession(
  sessionId: string,
  title: string,
): Promise<ChatSessionSummary> {
  const response = await fetch(`/chat-api/chat/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "채팅 이름을 변경하지 못했습니다.");
  }

  return response.json();
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const response = await fetch(`/chat-api/chat/sessions/${sessionId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "채팅을 삭제하지 못했습니다.");
  }
}
