export interface ChatRequest {
  userId: string;
  message: string;
}

export interface ChatResponse {
  answer: string;
}

export async function sendMessage(
  userId: string,
  message: string,
): Promise<string> {
  const response = await fetch("http://localhost:9999/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      message,
    } as ChatRequest),
  });

  // 🔥 Spring에서 JSON으로 주는 경우
  const raw = await response.text();

  if (!response.ok) {
    throw new Error(raw || "챗봇 API 호출에 실패했습니다.");
  }

  if (!raw.trim()) {
    return "";
  }

  try {
    const data = JSON.parse(raw) as ChatResponse | string;

    if (typeof data === "string") {
      return data;
    }

    if (typeof data.answer === "string") {
      return data.answer;
    }
  } catch {
    return raw;
  }

  return raw;
}
