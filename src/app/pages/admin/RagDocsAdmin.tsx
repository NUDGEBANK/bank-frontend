import { useEffect, useRef, useState } from "react";
import { FileText, RefreshCcw, Trash2, Upload } from "lucide-react";

import {
  deleteRagDocument,
  getRagDocuments,
  ingestRagDocument,
  type RagDocumentSummary,
} from "../../api/ragdocs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function RagDocsAdmin() {
  const [documents, setDocuments] = useState<RagDocumentSummary[]>([]);
  const [logs, setLogs] = useState<string[]>(["관리자 페이지가 준비되었습니다."]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loanProductIdInput, setLoanProductIdInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RagDocumentSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadDocuments(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const items = await getRagDocuments();
      setDocuments(items);
      if (!silent) {
        setLogs(["등록된 RAG 문서 목록을 불러왔습니다."]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "문서 목록을 불러오지 못했습니다.";
      setLogs([message]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function runUpload(overwriteConfirmed: boolean) {
    if (!selectedFile) {
      setLogs(["업로드할 PDF 파일을 먼저 선택해 주세요."]);
      return;
    }

    setSubmitting(true);
    setOverwriteOpen(false);
    setLogs(["업로드 요청을 전송했습니다."]);

    try {
      const parsedProductId = loanProductIdInput.trim() ? Number(loanProductIdInput.trim()) : undefined;
      const response = await ingestRagDocument({
        file: selectedFile,
        loanProductId:
          typeof parsedProductId === "number" && Number.isFinite(parsedProductId)
            ? parsedProductId
            : undefined,
        overwriteConfirmed,
      });

      setLogs(response.logs);

      if (response.status === "needs_confirmation") {
        setOverwriteOpen(true);
        return;
      }

      setLoanProductIdInput(String(response.assigned_product_id));
      await loadDocuments({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "문서 업로드에 실패했습니다.";
      setLogs([message]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await deleteRagDocument(deleteTarget.loan_product_id);
      setLogs(response.logs);
      setDeleteTarget(null);
      await loadDocuments({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "문서 삭제에 실패했습니다.";
      setLogs([message]);
    } finally {
      setSubmitting(false);
    }
  }

  const pendingProductId = loanProductIdInput.trim() || "자동 배정";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f3f6fb_0%,#eef2f7_42%,#e4ebf2_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Admin RAG Docs</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">RAG 문서 적재 관리자</h1>
              <p className="mt-2 text-sm text-slate-500">
                PDF 업로드, 상품 ID 지정 또는 자동 배정, 덮어쓰기 확인, 삭제를 한 화면에서 처리합니다.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => void loadDocuments({ silent: true })}
              disabled={refreshing || submitting}
            >
              <RefreshCcw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-200/80 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">업로드</CardTitle>
              <CardDescription>기존 적재 스크립트 흐름대로 PDF를 청크 분할하고 벡터를 저장합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">PDF 파일</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200"
                  >
                    파일 선택
                  </button>
                  <span className="min-w-0 truncate text-sm text-slate-600">
                    {selectedFile ? selectedFile.name : "선택된 파일 없음"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  PDF 파일만 업로드할 수 있습니다.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">상품 ID</label>
                <Input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={loanProductIdInput}
                  onChange={(event) => setLoanProductIdInput(event.target.value)}
                  placeholder="비워두면 자동 배정"
                  className="h-11 border-slate-300 bg-white"
                />
                <p className="text-xs text-slate-500">
                  입력하지 않으면 서버가 다음 사용 가능한 상품 ID를 자동 배정합니다.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                업로드 대상 상품 ID: <span className="font-semibold">{pendingProductId}</span>
              </div>

              <button
                type="button"
                onClick={() => void runUpload(false)}
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50"
                style={{ color: "#ffffff", backgroundColor: "#0f172a" }}
              >
                <Upload className="size-4" style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>{submitting ? "처리 중..." : "문서 업로드"}</span>
              </button>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-[#0f172a] text-slate-50 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-50">작업 로그</CardTitle>
              <CardDescription className="text-slate-300">
                기존 `ingest_bank_docs.py`에서 보던 진행 로그를 관리자 화면에 표시합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[440px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-slate-100">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={`${log}-${index}`} className="border-b border-white/5 py-1 last:border-b-0">
                      {log}
                    </div>
                  ))
                ) : (
                  <div>표시할 로그가 없습니다.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200/80 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">등록 문서</CardTitle>
            <CardDescription>상품 ID 기준으로 현재 적재된 문서를 확인하고 바로 삭제할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                문서 목록을 불러오는 중입니다.
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                등록된 문서가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.loan_product_id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-slate-900 p-2 text-slate-50">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-50">
                            상품 ID {document.loan_product_id}
                          </span>
                          <span className="text-xs text-slate-500">{document.chunk_count}개 청크</span>
                        </div>
                        <p className="mt-2 truncate text-sm font-semibold text-slate-900">{document.source_name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          최근 적재: {formatDate(document.updated_at)} / 최초 적재: {formatDate(document.created_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteTarget(document)}
                      disabled={submitting}
                    >
                      <Trash2 className="size-4" />
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={overwriteOpen} onOpenChange={setOverwriteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>기존 문서를 덮어쓸까요?</AlertDialogTitle>
            <AlertDialogDescription>
              같은 상품 ID에 문서가 이미 등록되어 있습니다. 확인하면 기존 청크를 삭제한 뒤 새 PDF로 다시 적재합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="bg-slate-900 text-slate-50 hover:bg-slate-800 hover:text-white"
              onClick={(event) => {
                event.preventDefault();
                void runUpload(true);
              }}
            >
              덮어쓰기 진행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `상품 ID ${deleteTarget.loan_product_id}의 ${deleteTarget.source_name} 문서를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
                : "선택된 문서가 없습니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="bg-red-600 text-slate-50 hover:bg-red-700 hover:text-white"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
