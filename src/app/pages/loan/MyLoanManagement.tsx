﻿﻿﻿import { Calendar, Calculator, ChevronDown, ChevronUp, FileSearch, TrendingDown, Upload } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { getJson, postJson } from "../../lib/api";
import { checkAuthentication } from "../../lib/auth";

type LoanApplicationSummary = {
  loanApplicationId: number;
  productKey: string;
  productName: string;
  applicationStatus: string;
  appliedAt: string;
  requiresCertificateSubmission: boolean;
  certificateSubmitted: boolean;
  preferentialRateVerificationAvailable: boolean;
  preferentialRateVerificationSubmitted: boolean;
  preferentialRateVerificationStatus: string | null;
};

type CompletedLoanHistory = {
  loanHistoryId: number;
  productKey: string;
  productName: string;
  status: string;
  totalPrincipal: number;
  interestRate: number;
  repaymentType: string;
  startDate: string;
  completedAt: string;
};

type UploadStatus = "idle" | "selected" | "uploading" | "completed" | "failed";

type CertificateSubmissionResponse = {
  submissionId: number;
  filename: string;
  contentType: string;
  processingStatus: string;
  detectedCertificateDate: string | null;
  extractedText: string;
  lines: string[];
  lineCount: number;
  verificationStatus: string;
  failureReason: string | null;
  submittedAt: string;
};

type MyLoanSummary = {
  loanHistoryId: number;
  status: string;
  totalPrincipal: number;
  remainingPrincipal: number;
  repaidPrincipal: number;
  baseInterestRate: number;
  minimumInterestRate: number;
  preferentialRateDiscount: number;
  interestRate: number;
  repaymentType: string;
  startDate: string;
  endDate: string;
  nextPaymentDate: string | null;
  nextPaymentPrincipal: number;
  nextPaymentInterest: number;
  nextPaymentAmount: number;
  cumulativeInterest: number;
  remainingInterestAmount: number;
  repaymentAccountNumber: string;
};

type MyLoanRepaymentSchedule = {
  scheduleId: number;
  dueDate: string;
  plannedPrincipal: number;
  plannedInterest: number;
  paidPrincipal: number;
  paidInterest: number;
  settled: boolean;
  overdueDays: number | null;
};

type Transaction = {
  transactionId: number;
  cardId: number | null;
  marketId: number | null;
  categoryId: number | null;
  qrId: string | null;
  amount: number;
  transactionDatetime: string;
  menuName: string | null;
  quantity: number | null;
};

type MyLoanRepaymentHistory = {
  repaymentId: number;
  repaymentAmount: number;
  repaymentRate: number;
  repaymentDatetime: string;
  remainingBalance: number;
  reason: string;
  transaction: Transaction | null;
};

type LoanRepaymentExecuteResponse = {
  repaymentAmount: number;
  paidPrincipal: number;
  paidInterest: number;
  overdueInterest: number;
  remainingPrincipal: number;
  loanStatus: string;
  autoTransferred: boolean;
};

const certificateGroups = [
  { label: "사무/기초", options: [{ id: "1", label: "컴퓨터활용능력 1급" }, { id: "2", label: "컴퓨터활용능력 2급" }, { id: "3", label: "워드프로세서" }, { id: "4", label: "한국사능력검정시험" }] },
  { label: "IT/데이터", options: [{ id: "5", label: "정보처리기사" }, { id: "6", label: "정보처리산업기사" }, { id: "7", label: "ADsP" }, { id: "8", label: "SQLD" }, { id: "9", label: "빅데이터분석기사" }] },
  { label: "회계/금융", options: [{ id: "10", label: "전산회계 1급" }, { id: "11", label: "전산세무 2급" }, { id: "12", label: "투자자산운용사" }, { id: "13", label: "AFPK" }, { id: "14", label: "신용분석사" }] },
  { label: "어학", options: [{ id: "18", label: "JLPT" }, { id: "19", label: "HSK" }] },
  { label: "전문 자격", options: [{ id: "20", label: "공인중개사" }, { id: "21", label: "감정평가사" }, { id: "22", label: "세무사" }, { id: "23", label: "공인회계사" }, { id: "24", label: "변호사" }] },
  { label: "기사", options: [{ id: "25", label: "전기기사" }, { id: "26", label: "산업안전기사" }, { id: "27", label: "건축기사" }, { id: "28", label: "토목기사" }, { id: "29", label: "기계기사" }] },
];

const certificateDiscountMap: Record<string, number> = {
  "1": 0.2,
  "2": 0.1,
  "3": 0.1,
  "4": 0.1,
  "5": 0.3,
  "6": 0.25,
  "7": 0.2,
  "8": 0.2,
  "9": 0.3,
  "10": 0.2,
  "11": 0.2,
  "12": 0.25,
  "13": 0.2,
  "14": 0.25,
  "18": 0.1,
  "19": 0.1,
  "20": 0.25,
  "21": 0.4,
  "22": 0.4,
  "23": 0.45,
  "24": 0.5,
  "25": 0.3,
  "26": 0.3,
  "27": 0.25,
  "28": 0.25,
  "29": 0.25,
};

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
  CERTIFICATE_DATE_NOT_FOUND: "문서에서 자격증 취득일 또는 발급일을 확인하지 못했습니다.",
  CERTIFICATE_DATE_BEFORE_APPLICATION: "대출 신청일 이후에 취득한 자격증만 우대금리 인증이 가능합니다.",
  LOAN_APPLICATION_DATE_NOT_FOUND: "대출 신청일 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
};

function getApplicationStatusLabel(application: LoanApplicationSummary) {
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

function parseLocalDate(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function normalizeSimulationAmount(value: number, max: number) {
  if (!Number.isFinite(value) || max <= 0) {
    return 0;
  }

  return Math.min(Math.max(value, 0), max);
}

function getPreferentialRateStatusLabel(application: LoanApplicationSummary) {
  if (!application.preferentialRateVerificationAvailable) {
    return "인증 대상 아님";
  }

  if (!application.preferentialRateVerificationSubmitted) {
    return "인증 필요";
  }

  switch (application.preferentialRateVerificationStatus) {
    case "VERIFIED":
      return "인증 완료";
    case "VERIFICATION_FAILED":
      return "인증 실패";
    case "PENDING":
      return "인증 대기";
    default:
      return application.preferentialRateVerificationStatus ?? "제출 완료";
  }
}

function getReviewStatusLabel(application: LoanApplicationSummary) {
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

export default function MyLoanManagement() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const applicationsRequestIdRef = useRef(0);
  const loanManagementRequestIdRef = useRef(0);
  const [simulationAmount, setSimulationAmount] = useState(1000000);
  const [applications, setApplications] = useState<LoanApplicationSummary[]>([]);
  const [completedLoans, setCompletedLoans] = useState<CompletedLoanHistory[]>([]);
  const [summary, setSummary] = useState<MyLoanSummary | null>(null);
  const [repaymentSchedules, setRepaymentSchedules] = useState<MyLoanRepaymentSchedule[]>([]);
  const [repaymentHistories, setRepaymentHistories] = useState<MyLoanRepaymentHistory[]>([]);
  const [isLoanDataLoading, setIsLoanDataLoading] = useState(false);
  const [loanDataError, setLoanDataError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<CertificateSubmissionResponse | null>(null);
  const [ocrVisualStepIndex, setOcrVisualStepIndex] = useState(0);
  const [certificateId, setCertificateId] = useState("");
  const [selectedProductKey, setSelectedProductKey] = useState("");
  const [repaymentAmountInput, setRepaymentAmountInput] = useState("");
  const [repaymentActionMessage, setRepaymentActionMessage] = useState<string | null>(null);
  const [isRepaymentSubmitting, setIsRepaymentSubmitting] = useState(false);
  const [isRepaymentHistoryExpanded, setIsRepaymentHistoryExpanded] = useState(false);

  const isApplicationOnOrAfterCompletedLoan = (
    application: LoanApplicationSummary,
    completedLoan: CompletedLoanHistory,
  ) => application.appliedAt.slice(0, 10) >= completedLoan.completedAt;

  const isApplicationActive = (application: LoanApplicationSummary) => {
    const latestCompletedLoan = completedLoans.find((loan) => loan.productKey === application.productKey);
    if (!latestCompletedLoan) {
      return true;
    }
    return isApplicationOnOrAfterCompletedLoan(application, latestCompletedLoan);
  };

  const refreshLoanManagement = async () => {
    const requestId = ++loanManagementRequestIdRef.current;
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      setSummary(null);
      setRepaymentSchedules([]);
      setRepaymentHistories([]);
      setLoanDataError(null);
      if (requestId === loanManagementRequestIdRef.current) {
        setIsLoanDataLoading(false);
      }
      return;
    }

    setIsLoanDataLoading(true);
    setLoanDataError(null);

    try {
      const productQuery = selectedProductKey ? `?productKey=${selectedProductKey}` : "";
      const [nextSummary, nextSchedules, nextHistories] = await Promise.all([
        getJson<MyLoanSummary>(`/api/loans/me/summary${productQuery}`),
        getJson<MyLoanRepaymentSchedule[]>(`/api/loans/me/repayment-schedules${productQuery}`),
        getJson<MyLoanRepaymentHistory[]>(`/api/loans/me/repayment-histories${productQuery}`),
      ]);

      if (requestId === loanManagementRequestIdRef.current) {
        setSummary(nextSummary);
        setRepaymentSchedules(nextSchedules);
        setRepaymentHistories(nextHistories);
      }
    } catch (error) {
      if (requestId === loanManagementRequestIdRef.current) {
        setSummary(null);
        setRepaymentSchedules([]);
        setRepaymentHistories([]);
        setLoanDataError(error instanceof Error ? error.message : "REQUEST_FAILED");
      }
    } finally {
      if (requestId === loanManagementRequestIdRef.current) {
        setIsLoanDataLoading(false);
      }
    }
  };

  useEffect(() => {
    const syncApplications = async () => {
      const requestId = ++applicationsRequestIdRef.current;
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        setApplications([]);
        setCompletedLoans([]);
        return;
      }

      try {
        const [nextApplications, nextCompletedLoans] = await Promise.all([
          getJson<LoanApplicationSummary[]>("/api/loan-applications/me"),
          getJson<CompletedLoanHistory[]>("/api/loans/me/completed"),
        ]);
        if (requestId === applicationsRequestIdRef.current) {
          setApplications(nextApplications);
          setCompletedLoans(nextCompletedLoans);
        }
      } catch {
        if (requestId === applicationsRequestIdRef.current) {
          setApplications([]);
          setCompletedLoans([]);
        }
      }
    };
    const handleStorageChange = () => {
      void syncApplications();
    };
    void syncApplications();
    window.addEventListener("auth-change", syncApplications);
    window.addEventListener("loan-application-change", syncApplications);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("auth-change", syncApplications);
      window.removeEventListener("loan-application-change", syncApplications);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
      const handleStorageChange = () => {
      void refreshLoanManagement();
    };
    void refreshLoanManagement();
    window.addEventListener("auth-change", refreshLoanManagement);
    window.addEventListener("loan-application-change", refreshLoanManagement);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("auth-change", refreshLoanManagement);
      window.removeEventListener("loan-application-change", refreshLoanManagement);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [selectedProductKey]);

  useEffect(() => {
    if (!selectedFile) {
      setSelectedFilePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setSelectedFilePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (uploadStatus === "idle") {
      setOcrVisualStepIndex(0);
      return;
    }

    if (uploadStatus === "selected") {
      setOcrVisualStepIndex(1);
      return;
    }

    if (uploadStatus === "completed" || uploadStatus === "failed") {
      setOcrVisualStepIndex(3);
      return;
    }

    setOcrVisualStepIndex(1);
    const stepTimer = window.setInterval(() => {
      setOcrVisualStepIndex((currentIndex) => (currentIndex >= 3 ? 3 : currentIndex + 1));
    }, 900);

    return () => {
      window.clearInterval(stepTimer);
    };
  }, [uploadStatus]);

  useEffect(() => {
    setSimulationAmount((currentAmount) =>
      normalizeSimulationAmount(currentAmount, summary?.remainingPrincipal ?? 0),
    );
  }, [summary?.remainingPrincipal]);

  const activeApplications = useMemo(
    () => applications.filter(isApplicationActive),
    [applications, completedLoans],
  );

  useEffect(() => {
    if (activeApplications.length === 0) {
      setSelectedProductKey("");
      return;
    }

    if (activeApplications.some((application) => application.productKey === selectedProductKey)) {
      return;
    }

    setSelectedProductKey(
      activeApplications.find((application) => application.productKey === "youth-loan")?.productKey ??
        activeApplications[0].productKey,
    );
  }, [activeApplications, selectedProductKey]);

  const repaidPrincipal = summary?.repaidPrincipal ?? 0;
  const repaymentProgress =
    summary && summary.totalPrincipal > 0 ? (repaidPrincipal / summary.totalPrincipal) * 100 : 0;
  const averagePrincipalPayment = useMemo(
    () =>
      repaymentSchedules.length > 0
        ? Math.round(
            repaymentSchedules.reduce((sum, item) => sum + item.plannedPrincipal, 0) /
              repaymentSchedules.length,
          )
        : 0,
    [repaymentSchedules],
  );
  const normalizedSimulationAmount = normalizeSimulationAmount(
    simulationAmount,
    summary?.remainingPrincipal ?? 0,
  );
  const estimatedSavedMonths =
    averagePrincipalPayment > 0 ? Math.floor(normalizedSimulationAmount / averagePrincipalPayment) : 0;
  const estimatedInterestSavings = Math.round(
    normalizedSimulationAmount *
      ((summary?.interestRate ?? 0) / 100) *
      (Math.max(estimatedSavedMonths, 1) / 12) *
      0.55,
  );
  const remainingAfterSimulation = Math.max(
    (summary?.remainingPrincipal ?? 0) - normalizedSimulationAmount,
    0,
  );
  const remainingInterestAmount = summary?.remainingInterestAmount ?? 0;
  const hasLoanData = !!summary;
  const showLoanLoadingState = isLoanDataLoading && !hasLoanData;
  const shouldShowLoanEmptyState = !isLoanDataLoading && activeApplications.length === 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextPaymentDate = summary?.nextPaymentDate
    ? parseLocalDate(summary.nextPaymentDate)
    : null;
  const daysUntilNextPayment = Math.max(
    nextPaymentDate
      ? Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    0,
  );

  const selectedApplication = useMemo(
    () =>
      activeApplications.find((application) => application.productKey === selectedProductKey) ??
      activeApplications[0] ??
      null,
    [activeApplications, selectedProductKey],
  );
  const canSubmitCertificate = !!selectedApplication?.preferentialRateVerificationAvailable;
  const isYouthLoanSelected = selectedApplication?.productKey === "youth-loan";
  const isConsumptionLoanSelected = selectedApplication?.productKey === "consumption-loan";
  const repaymentMethodLabel = !summary
    ? "상환 방식 정보 없음"
    : summary.repaymentType === "MATURITY_LUMP_SUM"
      ? "만기일시상환"
      : "원리금균등분할상환";
  const repaymentMethodDescription = !summary
    ? "대출 요약 정보가 준비되면 상환 방식을 확인할 수 있습니다."
    : summary.repaymentType === "MATURITY_LUMP_SUM"
      ? "매달 이자를 납부하고 만기일에 원금을 한 번에 상환합니다."
      : "매달 원금과 이자를 함께 나누어 상환합니다.";
  const preferentialRateStatus = selectedApplication
    ? getPreferentialRateStatusLabel(selectedApplication)
    : "대상 아님";
  const selectedCertificateDiscount = certificateId ? certificateDiscountMap[certificateId] ?? 0 : 0;
  const isMaturityLumpSum = summary?.repaymentType === "MATURITY_LUMP_SUM";
  const overdueRate = Math.min((summary?.interestRate ?? 0) + 3, 15);
  const manualRepaymentLimit = useMemo(() => {
    if (!repaymentSchedules.length) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unsettledSchedules = repaymentSchedules
      .filter((schedule) => !schedule.settled)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    if (!unsettledSchedules.length) {
      return 0;
    }

    const dueSchedules = unsettledSchedules.filter((schedule) => {
      const dueDate = parseLocalDate(schedule.dueDate);
      return dueDate.getTime() <= today.getTime();
    });

    const sumScheduleAmount = (schedules: MyLoanRepaymentSchedule[]) =>
      schedules.reduce(
        (sum, schedule) =>
          sum +
          Math.max(schedule.plannedPrincipal - schedule.paidPrincipal, 0) +
          Math.max(schedule.plannedInterest - schedule.paidInterest, 0),
        0,
      );

    if (dueSchedules.length > 0) {
      return sumScheduleAmount(dueSchedules);
    }

    if (isConsumptionLoanSelected) {
      const hasPrepaidFutureSchedule = repaymentSchedules.some((schedule) => {
        if (!schedule.settled) {
          return false;
        }
        const dueDate = parseLocalDate(schedule.dueDate);
        return dueDate.getTime() > today.getTime();
      });

      if (hasPrepaidFutureSchedule) {
        return 0;
      }
    }

    return sumScheduleAmount([unsettledSchedules[0]]);
  }, [isConsumptionLoanSelected, repaymentSchedules]);
  const overdueSchedules = repaymentSchedules.filter(
    (schedule) => !schedule.settled && (schedule.overdueDays ?? 0) > 0,
  );
  const maxOverdueDays = overdueSchedules.reduce(
    (max, schedule) => Math.max(max, schedule.overdueDays ?? 0),
    0,
  );
  const overdueInterestAmount = overdueSchedules.reduce((sum, schedule) => {
    const remainingDue =
      Math.max(schedule.plannedPrincipal - schedule.paidPrincipal, 0) +
      Math.max(schedule.plannedInterest - schedule.paidInterest, 0);
    const overdueDays = schedule.overdueDays ?? 0;
    return sum + (remainingDue * overdueRate * overdueDays) / 100 / 365;
  }, 0);
  const visibleRepaymentHistories = isRepaymentHistoryExpanded
    ? repaymentHistories
    : repaymentHistories.slice(0, 5);
  const isPdfPreview = !!selectedFile?.type.includes("pdf");
  const currentOcrStepIndex =
    uploadStatus === "completed" || uploadStatus === "failed"
      ? 3
      : uploadStatus === "uploading"
        ? ocrVisualStepIndex
        : uploadStatus === "selected"
          ? 1
          : 0;

  const statusText: Record<UploadStatus, string> = {
    idle: "자기계발 대출 신청 후 자격증 파일을 제출할 수 있습니다.",
    selected: `선택한 파일: ${selectedFile?.name ?? ""}`,
    uploading: "OCR 요청을 전송하고 있습니다.",
    completed: "OCR 업로드가 완료되었습니다. 인증 결과를 확인해 주세요.",
    failed: uploadError ?? "업로드 중 오류가 발생했습니다.",
  };

  const handleManualRepayment = async () => {
    if (!selectedProductKey) {
      return;
    }

    const normalizedAmountText = repaymentAmountInput.trim().replaceAll(",", "");
    const repaymentAmountValue =
      normalizedAmountText.length > 0
        ? Number.parseFloat(normalizedAmountText)
        : summary?.nextPaymentAmount ?? 0;

    if (!Number.isFinite(repaymentAmountValue) || repaymentAmountValue <= 0) {
      setRepaymentActionMessage("상환 금액을 입력해 주세요.");
      return;
    }

    if (manualRepaymentLimit <= 0) {
      setRepaymentActionMessage(
        isConsumptionLoanSelected
          ? "현재 상환 가능한 회차가 없습니다. 소비분석 대출은 다음 달 1회차까지만 선납할 수 있습니다."
          : "현재 상환 가능한 회차가 없습니다.",
      );
      return;
    }

    if (repaymentAmountValue > manualRepaymentLimit) {
      setRepaymentActionMessage(
        `현재 상환 가능 금액은 ${formatAmount(manualRepaymentLimit)}입니다. 입력한 금액을 다시 확인해 주세요.`,
      );
      return;
    }

    setIsRepaymentSubmitting(true);
    setRepaymentActionMessage(null);

    try {
      const response = await postJson<LoanRepaymentExecuteResponse>("/api/loans/me/repayments", {
        productKey: selectedProductKey,
        amount: repaymentAmountValue,
      });
      await refreshLoanManagement();
      setRepaymentActionMessage(
        `상환 완료: 원금 ${formatAmount(response.paidPrincipal)}, 이자 ${formatAmount(response.paidInterest)}`,
      );
    } catch (error) {
      setRepaymentActionMessage(
        error instanceof Error ? error.message : "상환 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setIsRepaymentSubmitting(false);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadStatus(file ? "selected" : "idle");
    setUploadError(null);
    setOcrResult(null);
  };

  const handleUpload = async () => {
    if (!selectedApplication || !selectedFile) {
      return;
    }

    if (!certificateId) {
      setUploadStatus("failed");
      setUploadError("자격증 종류를 선택해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("loanApplicationId", String(selectedApplication.loanApplicationId));
    formData.append("certificateId", certificateId);
    formData.append("file", selectedFile);

    setUploadStatus("uploading");
    setUploadError(null);

    try {
      const response = await fetch(`/api/certificates/submissions`, {
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
          {activeApplications.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                    Selected Product
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">신청 상품별 대출 관리</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    신청한 상품을 선택하면 해당 상품 기준 대출 정보와 상환 현황을 확인할 수 있습니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeApplications.map((application) => {
                    const isSelected = application.productKey === selectedProductKey;
                    return (
                      <button
                        key={application.loanApplicationId}
                        type="button"
                        onClick={() => setSelectedProductKey(application.productKey)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          isSelected
                            ? "border-sky-600 bg-sky-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700"
                        }`}
                      >
                        {application.productName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {completedLoans.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    Completed Products
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">이전 상품 내역</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    완납한 상품을 선택하면 축하 페이지와 이전 이용 정보를 확인할 수 있습니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {completedLoans.map((loan) => (
                    <Link
                      key={loan.loanHistoryId}
                      to={`/loan/management/completed/${loan.loanHistoryId}`}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                    >
                      {loan.productName}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {showLoanLoadingState ? (
            <section className="rounded-3xl border border-slate-200 bg-slate-50/80 px-6 py-8 text-center text-sm text-slate-500">
              대출 관리 정보를 불러오는 중입니다.
            </section>
          ) : shouldShowLoanEmptyState ? (
            <section className="rounded-[32px] border border-white/70 bg-gradient-to-br from-slate-900 via-sky-900 to-emerald-700 px-6 py-10 text-white shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">
                  Loan Start
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  아직 진행 중인 대출이 없습니다
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100">
                  소비분석 대출과 자기계발 대출 상품을 비교하고, 지금 필요한 대출을 바로 신청할 수 있습니다.
                  완납한 상품은 위의 이전 상품 내역에서 다시 확인할 수 있습니다.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-5 backdrop-blur-sm">
                  <p className="text-sm text-sky-100">소비분석 대출</p>
                  <p className="mt-3 text-2xl font-bold">최대 300만원</p>
                  <p className="mt-2 text-sm text-slate-100">
                    소비 패턴 기반으로 한도와 상환 계획을 확인할 수 있습니다.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-5 backdrop-blur-sm">
                  <p className="text-sm text-sky-100">자기계발 대출</p>
                  <p className="mt-3 text-2xl font-bold">최대 500만원</p>
                  <p className="mt-2 text-sm text-slate-100">
                    자격증 OCR 인증과 우대금리 혜택을 함께 확인할 수 있습니다.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-5 backdrop-blur-sm">
                  <p className="text-sm text-sky-100">신청 후 관리</p>
                  <p className="mt-3 text-2xl font-bold">상환 일정 관리</p>
                  <p className="mt-2 text-sm text-slate-100">
                    신청 이후에는 상환 일정, 이자 정보, 이전 상품 내역을 한 번에 확인합니다.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/loan/products"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  대출 상품 보러가기
                </Link>
                <Link
                  to="/loan/credit-score"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  내 신용 점수 확인하기
                </Link>
              </div>
            </section>
          ) : (
            <>
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-sky-100 bg-sky-50/80 px-5 py-5">
              <p className="text-sm text-slate-500">잔여 원금</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatAmount(summary?.remainingPrincipal ?? 0)}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-sm text-slate-500">총 원금</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatAmount(summary?.totalPrincipal ?? 0)}
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
                연 {(summary?.interestRate ?? 0).toFixed(1)}%
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <p className="text-sm text-slate-500">상환 방식</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{repaymentMethodLabel}</p>
              <p className="mt-2 text-sm text-slate-600">{repaymentMethodDescription}</p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50/70 px-5 py-5">
              <p className="text-sm text-slate-500">상환 가상계좌</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {summary?.repaymentAccountNumber ?? "발급 예정"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                선택한 대출 상품 기준으로 입금 및 상환에 사용하는 계좌입니다.
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 px-5 py-5">
              <p className="text-sm text-slate-500">우대금리 상태</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{preferentialRateStatus}</p>
              <p className="mt-2 text-sm text-slate-600">
                {isYouthLoanSelected
                  ? "자격증 OCR 인증이 완료되면 우대금리가 현재 금리에 반영됩니다."
                  : "현재 선택한 상품은 OCR 우대금리 대상이 아닙니다."}
              </p>
            </div>
          </section>

          {isYouthLoanSelected && (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-slate-700">
              상환을 위해 가상계좌 번호를 확인하고 수동 상환으로 직접 납부해 주세요.
            </div>
          )}
          {repaymentActionMessage && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
              {repaymentActionMessage}
            </div>
          )}

          {summary && (
            <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">상환 실행</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {isYouthLoanSelected
                      ? "가상계좌 입금 또는 원하는 금액 입력으로 수동 상환을 진행할 수 있습니다."
                      : "가상계좌 입금 또는 원하는 금액 입력으로 수동 상환을 진행할 수 있습니다."}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-600">
                  <p>상환 가상계좌</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {summary.repaymentAccountNumber || "발급 예정"}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={repaymentAmountInput}
                  onChange={(event) => setRepaymentAmountInput(event.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  placeholder="상환 금액 입력"
                />
                <button
                  type="button"
                  onClick={handleManualRepayment}
                  disabled={isRepaymentSubmitting}
                  className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  수동 상환
                </button>
              </div>
            </section>
          )}

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">최근 상환 내역</h2>
                {repaymentHistories.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setIsRepaymentHistoryExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {isRepaymentHistoryExpanded ? "접기" : "더보기"}
                    {isRepaymentHistoryExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              <div className="mt-5 space-y-3">
                {visibleRepaymentHistories.map((repayment) => (
                  <div
                    key={repayment.repaymentId}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm text-slate-500">{repayment.repaymentDatetime.slice(0, 10)}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {formatAmount(repayment.repaymentAmount)}
                      </p>
                    </div>
                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 md:gap-8">
                      <div>
                        <p className="text-slate-500">원금</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          상환 이력에서 별도 제공 예정
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">이자</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          상환 이력에서 별도 제공 예정
                        </p>
                      </div>
                      {repayment.reason &&
                          (<div>
                        <p className="text-slate-500">자동상환 비율 산정 근거</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {repayment.reason}
                        </p>
                      </div>)}
                      {repayment.transaction && (
                          <div>
                            <p className="text-slate-500">결제 상품명</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {repayment.transaction.menuName}
                            </p>
                          </div>
                      )}
                      {repayment.transaction && (
                          <div>
                            <p className="text-slate-500">결제 금액</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {repayment.transaction.amount}
                            </p>
                          </div>
                      )}
                      {repayment.transaction && (
                          <div>
                            <p className="text-slate-500">결제 시간</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {repayment.transaction.transactionDatetime}
                            </p>
                          </div>
                      )}
                    </div>
                  </div>
                ))}
                {repaymentHistories.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
                    상환 내역이 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-bold text-slate-900">이자 정보</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">누적 납입 이자</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAmount(summary?.cumulativeInterest ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">잔여 예상 이자</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAmount(remainingInterestAmount)}
                  </p>
                </div>
                {summary && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-sm text-slate-500">다음 회차 이자 정보</p>
                    <p className="mt-2 text-sm text-slate-600">
                      예정 원금{" "}
                      <span className="font-semibold text-slate-900">
                        {formatAmount(summary.nextPaymentPrincipal)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      예정 이자{" "}
                      <span className="font-semibold text-slate-900">
                        {formatAmount(summary.nextPaymentInterest)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-slate-900">상환 일정</h2>
            <div className="mt-5 space-y-3">
              {repaymentSchedules.map((schedule) => (
                <div
                  key={schedule.scheduleId}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{schedule.dueDate}</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {schedule.settled ? "납부 완료" : "납부 예정"}
                      </p>
                    </div>
                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-slate-500">예정 원금</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatAmount(schedule.plannedPrincipal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">예정 이자</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatAmount(schedule.plannedInterest)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">납부 원금</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatAmount(schedule.paidPrincipal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">납부 이자</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatAmount(schedule.paidInterest)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {repaymentSchedules.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
                  상환 일정이 없습니다.
                </div>
              )}
            </div>
          </section>
            </>
          )}

          {isLoanDataLoading && hasLoanData && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-500">
              대출 관리 정보를 불러오는 중입니다.
            </div>
          )}

          {loanDataError && !isLoanDataLoading && !shouldShowLoanEmptyState && !hasLoanData && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              {loanDataError === "대출 관리 정보가 없습니다."
                ? "현재 조회할 대출 관리 정보가 없습니다."
                : loanDataError}
            </div>
          )}

          {selectedApplication?.preferentialRateVerificationAvailable && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <style>{`
                @keyframes ocr-scan-line {
                  0% { transform: translateY(-12%); opacity: 0; }
                  12% { opacity: 1; }
                  50% { opacity: 1; }
                  88% { opacity: 1; }
                  100% { transform: translateY(300px); opacity: 0; }
                }
              `}</style>
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
                    Preferential Rate
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
                      {selectedApplication.productName}
                    </span>
                  </p>
                  <p className="mt-1">
                    상태{" "}
                    <span className="font-semibold text-sky-700">
                      {getReviewStatusLabel(selectedApplication)}
                    </span>
                  </p>
                  <p className="mt-1">
                    인증 상태{" "}
                    <span className="font-semibold text-sky-700">
                      {getPreferentialRateStatusLabel(selectedApplication)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
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
                              {certificate.label} (-{(certificateDiscountMap[certificate.id] ?? 0).toFixed(1)}%p)
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {certificateId && (
                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4">
                      <p className="text-sm font-semibold text-emerald-700">선택 자격증 우대금리</p>
                      <p className="mt-2 text-sm text-slate-700">
                        현재 선택한 자격증은 금리 <span className="font-semibold text-slate-900">-{selectedCertificateDiscount.toFixed(1)}%p</span> 인하 대상입니다.
                      </p>
                    </div>
                  )}

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
                    <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {selectedFile ? selectedFile.name : "선택된 파일이 없습니다."}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {selectedFile
                                ? "문서 미리보기에서 OCR 스캔 과정을 확인할 수 있습니다."
                                : "파일을 선택하면 여기에 문서 미리보기가 표시됩니다."}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {selectedFile ? (isPdfPreview ? "PDF" : "IMAGE") : "PREVIEW"}
                          </span>
                        </div>
                        <div className="relative h-[360px] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
                          {selectedFilePreviewUrl ? (
                            <>
                              {isPdfPreview ? (
                                <object
                                  data={selectedFilePreviewUrl}
                                  type="application/pdf"
                                  className="h-full w-full"
                                >
                                  <iframe
                                    title="certificate-preview"
                                    src={selectedFilePreviewUrl}
                                    className="h-full w-full"
                                  />
                                </object>
                              ) : (
                                <img
                                  src={selectedFilePreviewUrl}
                                  alt="업로드한 자격증 미리보기"
                                  className="h-full w-full object-contain"
                                />
                              )}

                              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/12 to-transparent" />
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_38%,rgba(14,165,233,0.06)_68%,transparent)]" />
                                {(uploadStatus === "uploading" || uploadStatus === "completed") && (
                                  <>
                                    <div className="absolute inset-x-6 top-0 h-24 animate-[ocr-scan-line_2.2s_ease-in-out_infinite] rounded-full bg-[linear-gradient(180deg,rgba(56,189,248,0)_0%,rgba(56,189,248,0.12)_45%,rgba(34,197,94,0.38)_50%,rgba(56,189,248,0.12)_55%,rgba(56,189,248,0)_100%)] blur-sm" />
                                    <div className="absolute inset-x-8 top-0 h-px animate-[ocr-scan-line_2.2s_ease-in-out_infinite] bg-emerald-400/90 shadow-[0_0_24px_rgba(52,211,153,0.9)]" />
                                    <div className="absolute right-4 top-4 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
                                      {uploadStatus === "uploading" ? "문서 스캔 중" : "스캔 완료"}
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                                <Upload className="h-8 w-8 text-sky-700" />
                              </div>
                              <p className="text-sm font-semibold text-slate-800">문서 미리보기를 준비하고 있습니다</p>
                              <p className="mt-2 text-sm text-slate-500">
                                파일을 선택하면 OCR 분석 전 문서 내용을 바로 확인할 수 있습니다.
                              </p>
                            </div>
                          )}
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
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                                    index < currentOcrStepIndex
                                      ? "bg-emerald-100 text-emerald-700"
                                      : index === currentOcrStepIndex
                                        ? "bg-sky-100 text-sky-700"
                                        : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-700">{step}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {index < currentOcrStepIndex
                                      ? "완료"
                                      : index === currentOcrStepIndex
                                        ? uploadStatus === "uploading"
                                          ? "진행 중"
                                          : uploadStatus === "completed"
                                            ? "완료"
                                            : "대기"
                                        : "대기"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {ocrResult?.detectedCertificateDate && (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                            <p className="text-sm text-emerald-700">감지된 자격증 날짜</p>
                            <p className="mt-2 text-lg font-bold text-emerald-900">
                              {ocrResult.detectedCertificateDate}
                            </p>
                          </div>
                        )}
                      </div>
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
