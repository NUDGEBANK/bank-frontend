export interface ChatRequest {
  user_id: string;
  message: string;
  user_info: Record<string, any>;
  session_id?: string;
}

export interface ChatResponse {
  answer: string;
}

export async function sendMessage(
  userId: string,
  message: string,
  onChunk: (chunk: string) => void,
  sessionId?: string,
): Promise<string | null> {
  const response = await fetch("/api/chat", {
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
