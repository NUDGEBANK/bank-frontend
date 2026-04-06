import { Calendar, Calculator, FileSearch, TrendingDown, Upload } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { API_BASE, getJson } from "../../lib/api";

type LoanApplicationSummary = {
  loanApplicationId: number;
  productKey: string;
  productName: string;
  applicationStatus: string;
  appliedAt: string;
  requiresCertificateSubmission: boolean;
  certificateSubmitted: boolean;
};

type UploadStatus = "idle" | "selected" | "uploading" | "completed" | "failed";

type CertificateSubmissionResponse = {
  submissionId: number;
  filename: string;
  contentType: string;
  extractedText: string;
  lines: string[];
  lineCount: number;
  verificationStatus: string;
  failureReason: string | null;
  submittedAt: string;
};

const loanInfo = {
  totalPrincipal: 20000000,
  remainingPrincipal: 15000000,
  monthlyPayment: 450000,
  interestRate: 3.5,
  maturityDate: "2028-03-24",
  nextPaymentDate: "2026-04-25",
  nextPaymentAmount: 450000,
  cumulativeInterest: 1320000,
  estimatedRemainingInterest: 1840000,
  repaymentType: "원리금균등상환",
  autoDebitAccount: "110-294-882104",
};

const recentRepayments = [
  { date: "2026-03-25", amount: 450000, principal: 338000, interest: 112000 },
  { date: "2026-02-25", amount: 450000, principal: 335000, interest: 115000 },
  { date: "2026-01-25", amount: 450000, principal: 331000, interest: 119000 },
];

const certificateGroups = [
  { label: "사무/기초", options: [{ id: "1", label: "컴퓨터활용능력 1급" }, { id: "2", label: "컴퓨터활용능력 2급" }, { id: "3", label: "워드프로세서" }, { id: "4", label: "한국사능력검정시험" }] },
  { label: "IT/데이터", options: [{ id: "5", label: "정보처리기사" }, { id: "6", label: "정보처리산업기사" }, { id: "7", label: "ADsP" }, { id: "8", label: "SQLD" }, { id: "9", label: "빅데이터분석기사" }] },
  { label: "회계/금융", options: [{ id: "10", label: "전산회계 1급" }, { id: "11", label: "전산세무 2급" }, { id: "12", label: "투자자산운용사" }, { id: "13", label: "AFPK" }, { id: "14", label: "신용분석사" }] },
  { label: "어학", options: [{ id: "18", label: "JLPT" }, { id: "19", label: "HSK" }] },
  { label: "전문 자격", options: [{ id: "20", label: "공인중개사" }, { id: "21", label: "감정평가사" }, { id: "22", label: "세무사" }, { id: "23", label: "공인회계사" }, { id: "24", label: "변호사" }] },
  { label: "기사", options: [{ id: "25", label: "전기기사" }, { id: "26", label: "산업안전기사" }, { id: "27", label: "건축기사" }, { id: "28", label: "토목기사" }, { id: "29", label: "기계기사" }] },
];

const ocrSteps = ["자격증 선택", "파일 업로드", "OCR 추출", "정보 검증"];

const NO_TEXT_DETECTED_MESSAGE =
  "문서에서 자격증 정보를 확인하지 못했습니다. 자격증 전체가 잘 보이는 이미지 또는 PDF를 업로드해 주세요.";

const failureReasonMessages: Record<string, string> = {
  CERTIFICATE_NAME_MISMATCH: "선택한 자격증 종류와 업로드한 문서가 일치하지 않습니다.",
  ISSUER_NAME_MISMATCH: "발급기관 정보를 확인할 수 없습니다. 문서 원본을 다시 확인해 주세요.",
  NAME_MISMATCH: "회원 정보의 이름과 문서의 이름이 일치하지 않습니다.",
  PASS_KEYWORD_NOT_FOUND: "합격 또는 취득을 확인할 수 있는 문구를 찾지 못했습니다.",
  INVALID_DOCUMENT_TYPE: "자격증 증빙용 문서로 확인되지 않습니다.",
  OCR_TEXT_NOT_DETECTED: NO_TEXT_DETECTED_MESSAGE,
};

function getApplicationStatusLabel(application: LoanApplicationSummary) {
  if (application.productKey === "youth-loan" && application.certificateSubmitted) {
    return "서류 제출 완료";
  }

  switch (application.applicationStatus) {
    case "DOCUMENT_REQUIRED":
      return "서류 제출 필요";
    case "UNDER_REVIEW":
      return "심사 진행 중";
    case "APPROVED":
      return "이용 중";
    case "REJECTED":
      return "심사 반려";
    default:
      return application.applicationStatus;
  }
}

function formatAmount(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function MyLoanManagement() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [simulationAmount, setSimulationAmount] = useState(1000000);
  const [applications, setApplications] = useState<LoanApplicationSummary[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<CertificateSubmissionResponse | null>(null);
  const [certificateId, setCertificateId] = useState("");

  useEffect(() => {
    const syncApplications = async () => {
      if (localStorage.getItem("isLoggedIn") !== "true") {
        setApplications([]);
        return;
      }

      try {
        const nextApplications = await getJson<LoanApplicationSummary[]>("/api/loan-applications/me");
        setApplications(nextApplications);
      } catch {
        setApplications([]);
      }
    };
    void syncApplications();
    window.addEventListener("auth-change", syncApplications);
    window.addEventListener("loan-application-change", syncApplications);
    return () => {
      window.removeEventListener("auth-change", syncApplications);
      window.removeEventListener("loan-application-change", syncApplications);
    };
  }, []);

  const repaidPrincipal = loanInfo.totalPrincipal - loanInfo.remainingPrincipal;
  const repaymentProgress = (repaidPrincipal / loanInfo.totalPrincipal) * 100;
  const averagePrincipalPayment = useMemo(
    () =>
      Math.round(
        recentRepayments.reduce((sum, item) => sum + item.principal, 0) /
          recentRepayments.length,
      ),
    [],
  );
  const estimatedSavedMonths =
    averagePrincipalPayment > 0 ? Math.floor(simulationAmount / averagePrincipalPayment) : 0;
  const estimatedInterestSavings = Math.round(
    simulationAmount *
      (loanInfo.interestRate / 100) *
      (Math.max(estimatedSavedMonths, 1) / 12) *
      0.55,
  );
  const remainingAfterSimulation = Math.max(loanInfo.remainingPrincipal - simulationAmount, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextPaymentDate = new Date(`${loanInfo.nextPaymentDate}T00:00:00`);
  const daysUntilNextPayment = Math.max(
    Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    0,
  );

  const selfDevelopmentApplication = useMemo(
    () => applications.find((application) => application.productKey === "youth-loan") ?? null,
    [applications],
  );
  const canSubmitCertificate =
    !!selfDevelopmentApplication && !selfDevelopmentApplication.certificateSubmitted;

  const statusText: Record<UploadStatus, string> = {
    idle: "자기계발 대출 신청 후 자격증 파일을 제출할 수 있습니다.",
    selected: `선택한 파일: ${selectedFile?.name ?? ""}`,
    uploading: "OCR 요청을 전송하고 있습니다.",
    completed: "OCR 업로드가 완료되었습니다. 인증 결과를 확인해 주세요.",
    failed: uploadError ?? "업로드 중 오류가 발생했습니다.",
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadStatus(file ? "selected" : "idle");
    setUploadError(null);
    setOcrResult(null);
  };

  const handleUpload = async () => {
    if (!selfDevelopmentApplication || !selectedFile) {
      return;
    }

    if (!certificateId) {
      setUploadStatus("failed");
      setUploadError("자격증 종류를 선택해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("loanId", String(selfDevelopmentApplication.loanApplicationId));
    formData.append("certificateId", certificateId);
    formData.append("file", selectedFile);

    setUploadStatus("uploading");
    setUploadError(null);

    try {
      const response = await fetch(`${API_BASE}/api/certificates/submissions`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
        const message = errorBody?.message ?? "자격증 업로드에 실패했습니다.";
        throw new Error(
          message.includes("No text detected from image")
            ? NO_TEXT_DETECTED_MESSAGE
            : message,
        );
      }

      const result = (await response.json()) as CertificateSubmissionResponse;
      setOcrResult(result);

      if (result.verificationStatus === "VERIFICATION_FAILED" && result.failureReason) {
        setUploadStatus("failed");
        setUploadError(
          failureReasonMessages[result.failureReason] ??
            "자격증 인증에 실패했습니다. 업로드한 문서를 다시 확인해 주세요.",
        );
        return;
      }

      setUploadStatus("completed");
      window.dispatchEvent(new Event("loan-application-change"));
    } catch (error) {
      setUploadStatus("failed");
      setUploadError(
        error instanceof Error ? error.message : "예기치 못한 오류가 발생했습니다.",
      );
      setOcrResult(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-6 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
            Loan Management
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">내 대출 관리</h1>
          <p className="mt-2 text-sm text-slate-500">
            상환 현황, 조기 상환 시뮬레이션, 신청 중인 상품 상태를 한 곳에서 확인할 수 있습니다.
          </p>
        </div>

        <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-sky-100 bg-sky-50/80 px-5 py-5">
              <p className="text-sm text-slate-500">잔여 원금</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatAmount(loanInfo.remainingPrincipal)}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-sm text-slate-500">총 원금</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatAmount(loanInfo.totalPrincipal)}
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 px-5 py-5">
              <p className="text-sm text-slate-500">누적 상환 원금</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatAmount(repaidPrincipal)}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-sm text-slate-500">금리</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                연 {loanInfo.interestRate.toFixed(1)}%
              </p>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">조기 상환 시뮬레이션</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    추가 상환 원금을 입력하면 예상 종료 시점과 절감 이자를 계산합니다.
                  </p>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max={loanInfo.remainingPrincipal}
                step="100000"
                value={simulationAmount}
                onChange={(event) => setSimulationAmount(Number(event.target.value))}
                className="w-full accent-sky-600"
              />
              <input
                type="number"
                value={simulationAmount}
                onChange={(event) => setSimulationAmount(Number(event.target.value))}
                className="mt-4 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-5">
                  <p className="text-sm text-slate-500">추가 상환 후 잔액</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAmount(remainingAfterSimulation)}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-5 py-5">
                  <p className="text-sm text-slate-500">예상 단축 기간</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    약 {estimatedSavedMonths}개월
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/60 px-5 py-5">
                <p className="text-sm text-slate-500">예상 절감 이자</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatAmount(estimatedInterestSavings)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">내 대출 신청</h2>
                <p className="mt-1 text-sm text-slate-500">
                  신청한 상품이 있으면 진행 상태를, 없으면 신청 가능한 상품을 안내합니다.
                </p>
              </div>

              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.loanApplicationId}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
                    >
                      <p className="text-sm text-slate-500">{application.productName}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        상태 <span className="font-semibold text-sky-700">{getApplicationStatusLabel(application)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-6">
                  <p className="text-sm text-slate-500">현재 신청한 대출 상품이 없습니다.</p>
                  <Link
                    to="/loan/products"
                    className="mt-4 inline-block rounded-xl bg-[#6d8ca6] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#5c7c97]"
                  >
                    대출 상품 보러가기
                  </Link>
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-4">
                <p className="text-sm text-slate-500">다음 납입 예정일</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {loanInfo.nextPaymentDate} / {formatAmount(loanInfo.nextPaymentAmount)}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  오늘 기준 {daysUntilNextPayment}일 남았습니다.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-bold text-slate-900">최근 상환 내역</h2>
              <div className="mt-5 space-y-3">
                {recentRepayments.map((repayment) => (
                  <div
                    key={repayment.date}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm text-slate-500">{repayment.date}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {formatAmount(repayment.amount)}
                      </p>
                    </div>
                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 md:gap-8">
                      <div>
                        <p className="text-slate-500">원금</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatAmount(repayment.principal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">이자</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatAmount(repayment.interest)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-bold text-slate-900">이자 정보</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">누적 납입 이자</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAmount(loanInfo.cumulativeInterest)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">잔여 예상 이자</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAmount(loanInfo.estimatedRemainingInterest)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {selfDevelopmentApplication && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
                    Self Development
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    자기계발 대출 OCR 제출
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    자기계발 대출 신청자에게만 보이는 제출 영역입니다.
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-4 text-sm text-slate-600">
                  <p>
                    신청 상품{" "}
                    <span className="font-semibold text-slate-900">
                      {selfDevelopmentApplication.productName}
                    </span>
                  </p>
                  <p className="mt-1">
                    상태{" "}
                    <span className="font-semibold text-sky-700">
                      {getApplicationStatusLabel(selfDevelopmentApplication)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
                <div>
                  <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-medium text-slate-700">지원 자격증 안내</p>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                        총 26종
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      {certificateGroups.map((group) => (
                        <span
                          key={group.label}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1"
                        >
                          {group.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!canSubmitCertificate && (
                    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4">
                      <p className="text-sm font-semibold text-emerald-700">서류 제출 완료</p>
                      <p className="mt-2 text-sm text-slate-600">
                        자기계발 대출 신청 건에 필요한 서류 제출이 완료되었습니다. 인증 결과와 진행 상태를 확인해 주세요.
                      </p>
                    </div>
                  )}

                  <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <p className="mb-1 text-xs font-medium text-slate-500">자격증 종류</p>
                    <select
                      value={certificateId}
                      onChange={(event) => setCertificateId(event.target.value)}
                      className="w-full bg-transparent py-1 text-sm text-slate-900 outline-none"
                    >
                      <option value="">자격증 종류 선택</option>
                      {certificateGroups.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((certificate) => (
                            <option key={certificate.id} value={certificate.id}>
                              {certificate.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-3xl border-2 border-dashed border-sky-200 bg-slate-50 p-8">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
                      <Upload className="h-7 w-7 text-sky-700" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-slate-900">자격증 파일 업로드</h3>
                    <p className="mb-6 text-slate-500">
                      JPG, PNG, PDF 형식의 자격증 파일을 업로드해 주세요.
                    </p>
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                      <p className="text-sm font-medium text-slate-700">
                        {selectedFile ? selectedFile.name : "선택된 파일이 없습니다."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!canSubmitCertificate}
                        className="rounded-xl bg-sky-100 py-4 font-bold text-slate-900 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:flex-1"
                      >
                        파일 선택
                      </button>
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!canSubmitCertificate || !selectedFile || uploadStatus === "uploading"}
                        className="rounded-xl bg-[#8ea9bc] py-4 font-bold text-white shadow-md transition hover:bg-[#7d9aae] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700 disabled:opacity-100 sm:flex-1"
                      >
                        {uploadStatus === "uploading" ? "업로드 중..." : "업로드 시작"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
                        <FileSearch className="h-5 w-5 text-sky-700" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">OCR 진행 상태</p>
                        <h3 className="text-lg font-bold text-slate-900">업로드 현황</h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500">{statusText[uploadStatus]}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                    <p className="mb-3 text-sm text-slate-500">인증 단계</p>
                    <div className="space-y-3">
                      {ocrSteps.map((step, index) => (
                        <div key={step} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                            {index + 1}
                          </div>
                          <p className="text-sm font-medium text-slate-700">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {uploadStatus === "failed" && uploadError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                      <p className="mb-2 text-sm text-red-700">업로드 오류</p>
                      <p className="text-sm text-red-900">{uploadError}</p>
                    </div>
                  )}

                  {ocrResult && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="mb-2 text-sm text-slate-500">인증 결과</p>
                      <h3 className="mb-4 text-lg font-bold text-slate-900">
                        {ocrResult.verificationStatus === "VERIFIED"
                          ? "자격증 인증 완료"
                          : "자격증 인증 확인 필요"}
                      </h3>
                      <div className="space-y-3 text-sm text-slate-600">
                        <p>
                          인증 상태{" "}
                          <span className="font-semibold text-slate-900">
                            {ocrResult.verificationStatus}
                          </span>
                        </p>
                        <p>
                          추출 라인 수{" "}
                          <span className="font-semibold text-slate-900">
                            {ocrResult.lineCount}
                          </span>
                        </p>
                        {ocrResult.failureReason && (
                          <p>
                            실패 사유{" "}
                            <span className="font-semibold text-slate-900">
                              {failureReasonMessages[ocrResult.failureReason] ??
                                ocrResult.failureReason}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
