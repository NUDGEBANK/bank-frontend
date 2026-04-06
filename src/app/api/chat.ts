export interface ChatRequest {
  user_id: string;
  message: string;
  user_info: Record<string, any>;
}

export interface ChatResponse {
  answer: string;
}

export async function sendMessage(
  userId: string,
  message: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const response = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      message,
      user_info: {},
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
}
