import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

import {
  deleteRagDocument,
  getRagDocuments,
  ingestRagDocument,
  type RagDocumentSummary,
  type RagIngestResponse,
} from "../../api/ragdocs";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

type NoticeState = {
  tone: "success" | "warning" | "error";
  message: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function RagDocs() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<RagDocumentSummary[]>([]);
  const [loanProductId, setLoanProductId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [confirmation, setConfirmation] = useState<RagIngestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
          new Date(a.updated_at ?? a.created_at ?? 0).getTime(),
      ),
    [documents],
  );

  async function loadDocuments() {
    setIsLoading(true);
    setNotice(null);

    try {
      setDocuments(await getRagDocuments());
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "RAG 문서 목록을 불러오지 못했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function uploadDocument(overwriteConfirmed: boolean) {
    if (!selectedFile) {
      setNotice({ tone: "warning", message: "업로드할 PDF 파일을 선택해주세요." });
      return;
    }

    setIsUploading(true);
    setConfirmation(null);
    setNotice(null);
    setLogs([]);

    try {
      const result = await ingestRagDocument(
        selectedFile,
        loanProductId,
        overwriteConfirmed,
        (event) => {
          if (event.type === "log") {
            setLogs((current) => [...current, event.message]);
          }
        },
      );

      if (result.status === "needs_confirmation") {
        setConfirmation(result);
        setNotice({ tone: "warning", message: result.message });
        return;
      }

      setNotice({ tone: "success", message: result.message });
      setSelectedFile(null);
      setLoanProductId("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadDocuments();
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "RAG 문서 업로드 중 오류가 발생했습니다.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await uploadDocument(false);
  }

  async function handleDelete(document: RagDocumentSummary) {
    const confirmed = window.confirm(
      `상품 ID ${document.loan_product_id}의 문서 "${document.source_name}"을 삭제할까요?`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(document.loan_product_id);
    setNotice(null);

    try {
      const result = await deleteRagDocument(document.loan_product_id);
      setNotice({
        tone: "success",
        message: `${result.message} 삭제된 청크: ${result.deleted_chunks}개`,
      });
      await loadDocuments();
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "RAG 문서 삭제 중 오류가 발생했습니다.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f7c9d]">
              RAG Docs Manager
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              RAG 문서 관리자
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              PDF를 벡터 문서로 적재하고, 등록된 문서를 확인하거나 삭제합니다.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadDocuments()}
            disabled={isLoading || isUploading}
            className="h-11 gap-2 rounded-lg border-slate-300 bg-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        {notice ? (
          <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
              notice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : notice.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {notice.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="leading-6">{notice.message}</span>
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f1fb] text-[#2a4b78]">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">PDF 업로드</h2>
                <p className="text-sm text-slate-500">상품 ID를 비우면 자동 배정됩니다.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">대출 상품 ID</span>
                <Input
                  value={loanProductId}
                  onChange={(event) => {
                    setLoanProductId(event.target.value.replace(/[^\d]/g, ""));
                    setConfirmation(null);
                  }}
                  inputMode="numeric"
                  placeholder="대출 상품 ID를 입력하세요."
                  className="mt-2 h-11 rounded-lg border-slate-300"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">PDF 파일</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => {
                    setSelectedFile(event.target.files?.[0] ?? null);
                    setConfirmation(null);
                  }}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-[#e8f1fb] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#2a4b78]"
                />
              </label>

              {selectedFile ? (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <FileText className="h-4 w-4 shrink-0 text-[#5f7c9d]" />
                  <span className="truncate">{selectedFile.name}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={isUploading}
                className="h-11 flex-1 gap-2 rounded-lg bg-[#5192ec] text-white hover:bg-[#203b60]"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                업로드
              </Button>
              {confirmation ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => void uploadDocument(true)}
                  className="h-11 rounded-lg border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                >
                  덮어쓰기
                </Button>
              ) : null}
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold">처리 로그</span>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {logs.length ? (
                  logs.map((log, index) => (
                    <p key={`${log}-${index}`} className="leading-5 text-slate-200">
                      {log}
                    </p>
                  ))
                ) : (
                  <p className="text-slate-400">아직 처리 로그가 없습니다.</p>
                )}
              </div>
            </div>
          </form>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">등록 문서</h2>
                <p className="mt-1 text-sm text-slate-500">
                  총 {documents.length.toLocaleString("ko-KR")}개 상품 문서
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">상품 ID</th>
                    <th className="px-5 py-3 font-semibold">문서명</th>
                    <th className="px-5 py-3 font-semibold">청크</th>
                    <th className="px-5 py-3 font-semibold">최근 갱신</th>
                    <th className="px-5 py-3 text-right font-semibold">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                        문서를 불러오는 중입니다.
                      </td>
                    </tr>
                  ) : sortedDocuments.length ? (
                    sortedDocuments.map((document) => (
                      <tr key={document.loan_product_id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-950">
                          {document.loan_product_id}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-[#5f7c9d]" />
                            <span className="max-w-[320px] truncate">
                              {document.source_name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {document.chunk_count.toLocaleString("ko-KR")}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(document.updated_at ?? document.created_at)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deletingId === document.loan_product_id}
                            onClick={() => void handleDelete(document)}
                            className="h-9 gap-2 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            {deletingId === document.loan_product_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            삭제
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                        등록된 RAG 문서가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
