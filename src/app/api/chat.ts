export interface ChatRequest {
  user_id: string;
  message: string;
  user_info: Record<string, any>;
  session_id?: string;
}

export interface ChatResponse {
  answer: string;
}

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

export async function sendMessage(
  userId: string,
  message: string,
  onChunk: (chunk: string) => void,
  sessionId?: string,
): Promise<string | null> {
  const response = await fetch("/chat-api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      user_id: userId,
      message,
      user_info: {},
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

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      onChunk(chunk);
    }
  }

  const lastChunk = decoder.decode();
  if (lastChunk) {
    onChunk(lastChunk);
  }

  return nextSessionId;
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

export async function getChatSession(sessionId: string): Promise<ChatSessionDetail> {
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

export async function renameChatSession(sessionId: string, title: string): Promise<ChatSessionSummary> {
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
