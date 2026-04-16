export interface RagDocumentSummary {
  loan_product_id: number;
  source_name: string;
  chunk_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface RagIngestResponse {
  status: "completed" | "needs_confirmation";
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

type ApiErrorPayload = {
  detail?: string;
  message?: string;
};

async function parseError(response: Response): Promise<string> {
  const data = (await response.json().catch(() => null)) as ApiErrorPayload | null;
  return data?.detail || data?.message || "요청 처리에 실패했습니다.";
}

export async function getRagDocuments(): Promise<RagDocumentSummary[]> {
  const response = await fetch("/chat-api/admin/ragdocs", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function ingestRagDocument(params: {
  file: File;
  loanProductId?: number;
  overwriteConfirmed?: boolean;
}): Promise<RagIngestResponse> {
  const formData = new FormData();
  formData.append("file", params.file);

  if (typeof params.loanProductId === "number" && Number.isFinite(params.loanProductId)) {
    formData.append("loan_product_id", String(params.loanProductId));
  }

  if (params.overwriteConfirmed) {
    formData.append("overwrite_confirmed", "true");
  }

  const response = await fetch("/chat-api/admin/ragdocs/ingest", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function deleteRagDocument(loanProductId: number): Promise<RagDeleteResponse> {
  const response = await fetch(`/chat-api/admin/ragdocs/${loanProductId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}
