export interface ChatRequest {
  user_id: string;
  message: string;
  user_info: Record<string, any>;
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

export interface ChatResponsePayload {
  answer: string;
  quickReplies?: ChatAction[]; // 버튼형 다음 질문 데이터
}

export interface SendMessageResult {
  sessionId: string | null;
  quickReplies: ChatAction[];
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

function parseSseBuffer(
  buffer: string,
  onChunk: (chunk: string) => void,
  onDone: (payload: ChatResponsePayload) => void,
): string {
  let rest = buffer;

  while (true) {
    const boundary = rest.indexOf("\n\n");
    if (boundary < 0) break;

    const rawEvent = rest.slice(0, boundary);
    rest = rest.slice(boundary + 2);

    const lines = rawEvent.split("\n");
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    const rawData = dataLines.join("\n");
    if (!rawData) continue;

    const payload = JSON.parse(rawData);

    if (eventName === "chunk") {
      onChunk(payload.text ?? "");
    }

    if (eventName === "done") {
      onDone(payload);
    }

    if (eventName === "error") {
      throw new Error(payload.message || "챗봇 응답 생성에 실패했습니다.");
    }
  }

  return rest;
}

export async function sendMessage(
  userId: string,
  message: string,
  onChunk: (chunk: string) => void,
  sessionId?: string,
): Promise<SendMessageResult> {
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
    throw new Error("스트림 응답 본문이 없습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  const nextSessionId = response.headers.get("X-Chat-Session-Id");

  let buffer = "";
  let finalQuickReplies: ChatAction[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = parseSseBuffer(buffer, onChunk, (payload) => {
      finalQuickReplies = payload.quickReplies ?? [];
    });
  }

  buffer += decoder.decode();
  buffer = parseSseBuffer(buffer, onChunk, (payload) => {
    finalQuickReplies = payload.quickReplies ?? [];
  });

  return {
    sessionId: nextSessionId,
    quickReplies: finalQuickReplies,
  };
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

export async function getChatSession(
  sessionId: string,
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
