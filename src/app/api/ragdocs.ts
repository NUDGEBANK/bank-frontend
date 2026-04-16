export interface RagDocumentSummary {
  loan_product_id: number;
  source_name: string;
  chunk_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface RagIngestResponse {
  status: "completed" | "needs_confirmation" | string;
  message: string;
  assigned_product_id: number;
  document: RagDocumentSummary | null;
  logs: string[];
}

export interface RagDeleteResponse {
  message: string;
  deleted_chunks: number;
  logs: string[];
}

export type RagIngestEvent =
  | { type: "log"; message: string }
  | { type: "result"; payload: RagIngestResponse }
  | { type: "error"; message: string };

export async function getRagDocuments(): Promise<RagDocumentSummary[]> {
  const response = await fetch("/chat-api/admin/ragdocs", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "RAG 문서 목록을 불러오지 못했습니다.");
  }

  return response.json();
}

export async function ingestRagDocument(
  file: File,
  loanProductId: string,
  overwriteConfirmed: boolean,
  onEvent: (event: RagIngestEvent) => void,
): Promise<RagIngestResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (loanProductId.trim()) {
    formData.append("loan_product_id", loanProductId.trim());
  }
  formData.append("overwrite_confirmed", String(overwriteConfirmed));

  const response = await fetch("/chat-api/admin/ragdocs/ingest", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "RAG 문서 업로드에 실패했습니다.");
  }

  if (!response.body) {
    throw new Error("업로드 진행 응답을 읽을 수 없습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let finalResult: RagIngestResponse | null = null;

  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const event = JSON.parse(trimmed) as RagIngestEvent;
    onEvent(event);
    if (event.type === "result") {
      finalResult = event.payload;
    }
    if (event.type === "error") {
      throw new Error(event.message);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      consumeLine(line);
    }
  }

  buffer += decoder.decode();
  consumeLine(buffer);

  if (!finalResult) {
    throw new Error("업로드 결과를 확인할 수 없습니다.");
  }

  return finalResult;
}

export async function deleteRagDocument(
  loanProductId: number,
): Promise<RagDeleteResponse> {
  const response = await fetch(`/chat-api/admin/ragdocs/${loanProductId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "RAG 문서 삭제에 실패했습니다.");
  }

  return response.json();
}
