﻿﻿﻿﻿import { ChevronDown, ChevronLeft, ChevronUp, Upload } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
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
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const applicationsRequestIdRef = useRef(0);
  const loanManagementRequestIdRef = useRef(0);
  const repaymentHistoryItemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrolledRepaymentIdRef = useRef<number | null>(null);
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
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [highlightedRepaymentId, setHighlightedRepaymentId] = useState<number | null>(null);
  const repaymentTransactionIdFromQuery = useMemo(() => {
    const value = new URLSearchParams(location.search).get("repaymentTransactionId");
    if (!value) {
      return null;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }, [location.search]);

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
  const preferredProductKeyFromQuery = useMemo(() => {
    if (repaymentTransactionIdFromQuery === null) {
      return null;
    }

    return activeApplications.some((application) => application.productKey === "consumption-loan")
      ? "consumption-loan"
      : null;
  }, [activeApplications, repaymentTransactionIdFromQuery]);

  useEffect(() => {
    if (activeApplications.length === 0) {
      setSelectedProductKey("");
      return;
    }

    if (
      preferredProductKeyFromQuery &&
      activeApplications.some((application) => application.productKey === preferredProductKeyFromQuery) &&
      selectedProductKey !== preferredProductKeyFromQuery
    ) {
      setSelectedProductKey(preferredProductKeyFromQuery);
      return;
    }

    if (activeApplications.some((application) => application.productKey === selectedProductKey)) {
      return;
    }

    setSelectedProductKey(
      activeApplications.find((application) => application.productKey === "youth-loan")?.productKey ??
        activeApplications[0].productKey,
    );
  }, [activeApplications, preferredProductKeyFromQuery, selectedProductKey]);

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
  const latestCompletedLoan = useMemo(() => {
    if (completedLoans.length === 0) {
      return null;
    }

    return [...completedLoans].sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0] ?? null;
  }, [completedLoans]);
  const canSubmitCertificate = !!selectedApplication?.preferentialRateVerificationAvailable;
  const isYouthLoanSelected = selectedApplication?.productKey === "youth-loan";
  const isConsumptionLoanSelected = selectedApplication?.productKey === "consumption-loan";
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
  const targetRepaymentHistory = useMemo(() => {
    if (repaymentTransactionIdFromQuery === null) {
      return null;
    }

    return (
      repaymentHistories.find(
        (repayment) => repayment.transaction?.transactionId === repaymentTransactionIdFromQuery,
      ) ?? null
    );
  }, [repaymentHistories, repaymentTransactionIdFromQuery]);

  useEffect(() => {
    if (!targetRepaymentHistory) {
      return;
    }

    const targetIndex = repaymentHistories.findIndex(
      (repayment) => repayment.repaymentId === targetRepaymentHistory.repaymentId,
    );
    if (targetIndex >= 5 && !isRepaymentHistoryExpanded) {
      setIsRepaymentHistoryExpanded(true);
    }
  }, [isRepaymentHistoryExpanded, repaymentHistories, targetRepaymentHistory]);

  const visibleRepaymentHistories = isRepaymentHistoryExpanded
    ? repaymentHistories
    : repaymentHistories.slice(0, 5);

  const visibleSchedules = isScheduleExpanded
    ? repaymentSchedules
    : repaymentSchedules.slice(0, 5);

  useEffect(() => {
    if (!targetRepaymentHistory) {
      scrolledRepaymentIdRef.current = null;
      return;
    }

    if (scrolledRepaymentIdRef.current === targetRepaymentHistory.repaymentId) {
      return;
    }

    const targetElement = repaymentHistoryItemRefs.current[targetRepaymentHistory.repaymentId];
    if (!targetElement) {
      return;
    }

    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    scrolledRepaymentIdRef.current = targetRepaymentHistory.repaymentId;
  }, [targetRepaymentHistory, visibleRepaymentHistories]);

  useEffect(() => {
    if (!targetRepaymentHistory) {
      setHighlightedRepaymentId(null);
      return;
    }

    setHighlightedRepaymentId(targetRepaymentHistory.repaymentId);
    const timerId = window.setTimeout(() => {
      setHighlightedRepaymentId((currentId) =>
        currentId === targetRepaymentHistory.repaymentId ? null : currentId,
      );
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [targetRepaymentHistory]);

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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-14">
        {/* 헤더 */}
        <Link
          to="/loan/products"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          대출 상품 목록
        </Link>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">내 대출 관리</h1>
            <p className="mt-2 text-sm text-slate-600">
              상환 현황, 조기 상환 시뮬레이션, 신청 중인 상품 상태를 한 곳에서 확인할 수 있습니다.
            </p>
          </div>

          {activeApplications.length > 0 && (
            <div className="flex flex-wrap gap-2 xl:max-w-[60%] xl:justify-end">
              {activeApplications.map((application) => {
                const isSelected = application.productKey === selectedProductKey;
                return (
                  <button
                    key={application.loanApplicationId}
                    type="button"
                    onClick={() => setSelectedProductKey(application.productKey)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-500 hover:text-slate-900"
                    }`}
                    style={isSelected ? { color: "#ffffff" } : undefined}
                  >
                    {application.productName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 space-y-5">
          {/* 이전 상품 내역 */}
          {latestCompletedLoan && (
            <section>
              <Link
                to={`/loan/management/completed/${latestCompletedLoan.loanHistoryId}`}
                className="inline-flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
                이전 대출 상품
              </Link>
            </section>
          )}

          {showLoanLoadingState ? (
            <section className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-slate-600 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              대출 관리 정보를 불러오는 중입니다.
            </section>
          ) : shouldShowLoanEmptyState ? (
            <section className="rounded-2xl bg-white px-6 py-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              <h2 className="text-lg font-bold text-slate-900">
                아직 진행 중인 대출이 없습니다
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                소비분석 대출과 자기계발 대출 상품을 비교하고, 지금 필요한 대출을 바로 신청할 수 있습니다.
                완납한 상품은 위의 이전 상품 내역에서 다시 확인할 수 있습니다.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-100 px-4 py-4">
                  <p className="text-xs font-medium text-slate-600">소비분석 대출</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">최대 300만원</p>
                  <p className="mt-1 text-sm text-slate-600">
                    소비 패턴 기반으로 한도와 상환 계획을 확인할 수 있습니다.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 px-4 py-4">
                  <p className="text-xs font-medium text-slate-600">자기계발 대출</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">최대 500만원</p>
                  <p className="mt-1 text-sm text-slate-600">
                    자격증 OCR 인증과 우대금리 혜택을 함께 확인할 수 있습니다.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 px-4 py-4">
                  <p className="text-xs font-medium text-slate-600">신청 후 관리</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">상환 일정 관리</p>
                  <p className="mt-1 text-sm text-slate-600">
                    신청 이후에는 상환 일정, 이자 정보, 이전 상품 내역을 한 번에 확인합니다.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Link
                  to="/loan/products"
                  className="flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-800"
                  style={{ color: "#ffffff" }}
                >
                  대출 상품 보러가기
                </Link>
                <Link
                  to="/loan/credit-score"
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  내 신용 점수 확인하기
                </Link>
              </div>
            </section>
          ) : (
            <>
              {/* 요약 통계 */}
              <section className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <p className="text-xs font-medium text-slate-600">잔여 원금</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAmount(summary?.remainingPrincipal ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <p className="text-xs font-medium text-slate-600">총 원금</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatAmount(summary?.totalPrincipal ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <p className="text-xs font-medium text-slate-600">누적 상환 원금</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatAmount(repaidPrincipal)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <p className="text-xs font-medium text-slate-600">금리</p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <p className="text-xl font-bold text-slate-900">
                      연 {(summary?.interestRate ?? 0).toFixed(2)}%
                    </p>
                    {isYouthLoanSelected && (summary?.preferentialRateDiscount ?? 0) > 0 && (
                      <span className="text-sm font-semibold text-emerald-600">
                        (-{(summary?.preferentialRateDiscount ?? 0).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {isYouthLoanSelected && (
                <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  상환을 위해 가상계좌 번호를 확인하고 수동 상환으로 직접 납부해 주세요.
                </div>
              )}
              {repaymentActionMessage && (
                <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  {repaymentActionMessage}
                </div>
              )}

              {/* 상환 실행 */}
              {summary && (
                <section className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <h2 className="text-sm font-bold text-slate-900">상환 실행</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    가상계좌 입금 또는 원하는 금액 입력으로 수동 상환을 진행할 수 있습니다.
                  </p>
                  <div className="mt-3 rounded-xl border border-slate-100 px-4 py-3 text-sm text-slate-600">
                    상환 가상계좌{" "}
                    <span className="font-semibold text-slate-900">
                      {summary.repaymentAccountNumber || "발급 예정"}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={repaymentAmountInput}
                      onChange={(event) => setRepaymentAmountInput(event.target.value)}
                      className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      placeholder="상환 금액 입력"
                    />
                    <button
                      type="button"
                      onClick={handleManualRepayment}
                      disabled={isRepaymentSubmitting}
                      className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      style={{ color: "#ffffff" }}
                    >
                      수동 상환
                    </button>
                  </div>
                </section>
              )}

              {/* 최근 상환 내역 + 이자 정보 */}
              <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                <div className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">최근 상환 내역</h2>
                    {repaymentHistories.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setIsRepaymentHistoryExpanded((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition hover:text-slate-900"
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
                  <div className="mt-4 space-y-3">
                    {visibleRepaymentHistories.map((repayment) => (
                      <div
                        key={repayment.repaymentId}
                        ref={(element) => {
                          repaymentHistoryItemRefs.current[repayment.repaymentId] = element;
                        }}
                        id={`repayment-history-${repayment.repaymentId}`}
                        className={`rounded-xl border px-4 py-3 ${
                          highlightedRepaymentId === repayment.repaymentId
                            ? "border-slate-400 bg-slate-50"
                            : "border-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-600">{repayment.repaymentDatetime.slice(0, 10)}</p>
                          <p className="text-sm font-bold text-slate-900">
                            {formatAmount(repayment.repaymentAmount)}
                          </p>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>원금</span>
                            <span className="font-semibold text-slate-900">상환 이력에서 별도 제공 예정</span>
                          </div>
                          <div className="flex justify-between">
                            <span>이자</span>
                            <span className="font-semibold text-slate-900">상환 이력에서 별도 제공 예정</span>
                          </div>
                          {repayment.reason && (
                            <div className="flex justify-between">
                              <span>자동상환 비율 산정 근거</span>
                              <span className="font-semibold text-slate-900">{repayment.reason}</span>
                            </div>
                          )}
                          {repayment.transaction && (
                            <>
                              <div className="flex justify-between">
                                <span>결제 상품명</span>
                                <span className="font-semibold text-slate-900">{repayment.transaction.menuName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>결제 금액</span>
                                <span className="font-semibold text-slate-900">{repayment.transaction.amount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>결제 시간</span>
                                <span className="font-semibold text-slate-900">{repayment.transaction.transactionDatetime}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {repaymentHistories.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-600">
                        상환 내역이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <h2 className="text-sm font-bold text-slate-900">이자 정보</h2>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-100 px-4 py-4">
                      <p className="text-xs font-medium text-slate-600">누적 납입 이자</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {formatAmount(summary?.cumulativeInterest ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 px-4 py-4">
                      <p className="text-xs font-medium text-slate-600">잔여 예상 이자</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {formatAmount(remainingInterestAmount)}
                      </p>
                    </div>
                    {summary && (
                      <div className="rounded-xl border border-slate-100 px-4 py-4">
                        <p className="text-xs font-medium text-slate-600">다음 회차 이자 정보</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">예정 원금</span>
                            <span className="font-semibold text-slate-900">
                              {formatAmount(summary.nextPaymentPrincipal)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">예정 이자</span>
                            <span className="font-semibold text-slate-900">
                              {formatAmount(summary.nextPaymentInterest)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* 상환 일정 */}
              <section className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">상환 일정</h2>
                  {repaymentSchedules.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setIsScheduleExpanded((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition hover:text-slate-900"
                    >
                      {isScheduleExpanded ? "접기" : `더보기 (${repaymentSchedules.length - 5}건)`}
                      {isScheduleExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {visibleSchedules.map((schedule) => (
                    <div
                      key={schedule.scheduleId}
                      className="rounded-xl border border-slate-100 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-slate-700">{schedule.dueDate}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          schedule.settled
                            ? "bg-slate-200 text-slate-700"
                            : (schedule.overdueDays ?? 0) > 0
                              ? "bg-red-50 text-red-600"
                              : "bg-slate-100 text-slate-700"
                        }`}>
                          {schedule.settled ? "납부 완료" : (schedule.overdueDays ?? 0) > 0 ? "연체" : "납부 예정"}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-4 text-sm text-slate-700 md:grid-cols-4">
                        <div className="flex justify-between md:flex-col">
                          <span>예정 원금</span>
                          <span className="text-sm font-semibold text-slate-900 md:mt-1 md:text-base">
                            {formatAmount(schedule.plannedPrincipal)}
                          </span>
                        </div>
                        <div className="flex justify-between md:flex-col">
                          <span>예정 이자</span>
                          <span className="text-sm font-semibold text-slate-900 md:mt-1 md:text-base">
                            {formatAmount(schedule.plannedInterest)}
                          </span>
                        </div>
                        <div className="flex justify-between md:flex-col">
                          <span>납부 원금</span>
                          <span className="text-sm font-semibold text-slate-900 md:mt-1 md:text-base">
                            {formatAmount(schedule.paidPrincipal)}
                          </span>
                        </div>
                        <div className="flex justify-between md:flex-col">
                          <span>납부 이자</span>
                          <span className="text-sm font-semibold text-slate-900 md:mt-1 md:text-base">
                            {formatAmount(schedule.paidInterest)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {repaymentSchedules.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-600">
                      상환 일정이 없습니다.
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {isLoanDataLoading && hasLoanData && (
            <div className="rounded-xl bg-white px-5 py-4 text-sm text-slate-600 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              대출 관리 정보를 불러오는 중입니다.
            </div>
          )}

          {loanDataError && !isLoanDataLoading && !shouldShowLoanEmptyState && !hasLoanData && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              {loanDataError === "대출 관리 정보가 없습니다."
                ? "현재 조회할 대출 관리 정보가 없습니다."
                : loanDataError}
            </div>
          )}

          {/* OCR 자격증 제출 */}
          {selectedApplication?.preferentialRateVerificationAvailable && (
            <section className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
              <style>{`
                @keyframes ocr-scan-line {
                  0% { transform: translateY(-12%); opacity: 0; }
                  12% { opacity: 1; }
                  50% { opacity: 1; }
                  88% { opacity: 1; }
                  100% { transform: translateY(300px); opacity: 0; }
                }
              `}</style>

              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">자기계발 대출 OCR 제출</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    자기계발 대출 신청자에게만 보이는 제출 영역입니다.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 px-4 py-3 text-sm">
                  <p className="text-slate-600">
                    신청 상품{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedApplication.productName}
                    </span>
                  </p>
                  <p className="mt-1 text-slate-600">
                    상태{" "}
                    <span className="font-semibold text-slate-700">
                      {getReviewStatusLabel(selectedApplication)}
                    </span>
                  </p>
                  <p className="mt-1 text-slate-600">
                    인증 상태{" "}
                    <span className="font-semibold text-slate-700">
                      {getPreferentialRateStatusLabel(selectedApplication)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-slate-100 px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">지원 자격증 안내</p>
                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    총 26종
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                  {certificateGroups.map((group) => (
                    <span
                      key={group.label}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                    >
                      {group.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-slate-200 px-4 py-3">
                <p className="mb-1 text-xs font-medium text-slate-600">자격증 종류</p>
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
                <div className="mb-4 rounded-xl border border-slate-100 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">선택 자격증 우대금리</p>
                  <p className="mt-1 text-sm text-slate-600">
                    현재 선택한 자격증은 금리 <span className="font-semibold text-slate-900">-{selectedCertificateDiscount.toFixed(1)}%p</span> 인하 대상입니다.
                  </p>
                </div>
              )}

              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <h3 className="text-sm font-bold text-slate-900">자격증 파일 업로드</h3>
                <p className="mt-1 text-sm text-slate-600">
                  JPG, PNG, PDF 형식의 자격증 파일을 업로드해 주세요.
                </p>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {selectedFile ? selectedFile.name : "선택된 파일이 없습니다."}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {selectedFile
                            ? "문서 미리보기에서 OCR 스캔 과정을 확인할 수 있습니다."
                            : "파일을 선택하면 여기에 문서 미리보기가 표시됩니다."}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {selectedFile ? (isPdfPreview ? "PDF" : "IMAGE") : "PREVIEW"}
                      </span>
                    </div>
                    <div className="relative h-[360px] bg-slate-50">
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
                            {(uploadStatus === "uploading" || uploadStatus === "completed") && (
                              <>
                                <div className="absolute inset-x-6 top-0 h-24 animate-[ocr-scan-line_2.2s_ease-in-out_infinite] rounded-full bg-[linear-gradient(180deg,rgba(56,189,248,0)_0%,rgba(56,189,248,0.12)_45%,rgba(34,197,94,0.38)_50%,rgba(56,189,248,0.12)_55%,rgba(56,189,248,0)_100%)] blur-sm" />
                                <div className="absolute inset-x-8 top-0 h-px animate-[ocr-scan-line_2.2s_ease-in-out_infinite] bg-emerald-400/90 shadow-[0_0_24px_rgba(52,211,153,0.9)]" />
                                <div className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                  {uploadStatus === "uploading" ? "문서 스캔 중" : "스캔 완료"}
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                          <Upload className="mb-3 h-8 w-8 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">문서 미리보기를 준비하고 있습니다</p>
                          <p className="mt-1 text-xs text-slate-600">
                            파일을 선택하면 OCR 분석 전 문서 내용을 바로 확인할 수 있습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-100 px-4 py-4">
                      <p className="text-xs font-medium text-slate-600">OCR 진행 상태</p>
                      <p className="mt-2 text-sm text-slate-700">{statusText[uploadStatus]}</p>
                    </div>

                    <div className="rounded-xl border border-slate-100 px-4 py-4">
                      <p className="mb-3 text-xs font-medium text-slate-600">인증 단계</p>
                      <div className="space-y-2.5">
                        {ocrSteps.map((step, index) => (
                          <div key={step} className="flex items-center gap-3">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                index < currentOcrStepIndex
                                  ? "bg-slate-900 text-white"
                                  : index === currentOcrStepIndex
                                    ? "bg-slate-200 text-slate-700"
                                    : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-700">{step}</p>
                              <p className="text-xs text-slate-600">
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
                      <div className="rounded-xl border border-slate-100 px-4 py-4">
                        <p className="text-xs font-medium text-slate-600">감지된 자격증 날짜</p>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          {ocrResult.detectedCertificateDate}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canSubmitCertificate}
                    className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    파일 선택
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!canSubmitCertificate || !selectedFile || uploadStatus === "uploading"}
                    className="flex-1 rounded-full bg-black py-3 text-sm font-semibold transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    style={{ color: "#ffffff" }}
                  >
                    {uploadStatus === "uploading" ? "업로드 중..." : "업로드 시작"}
                  </button>
                </div>
              </div>

              {uploadStatus === "failed" && uploadError && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-4">
                  <p className="text-xs text-red-500">업로드 오류</p>
                  <p className="mt-1 text-sm text-red-700">{uploadError}</p>
                </div>
              )}

              {ocrResult && (
                <div className="mt-4 rounded-xl border border-slate-100 px-4 py-4">
                  <p className="text-xs font-medium text-slate-600">인증 결과</p>
                  <h3 className="mt-1 text-sm font-bold text-slate-900">
                    {ocrResult.verificationStatus === "VERIFIED"
                      ? "자격증 인증 완료"
                      : "자격증 인증 확인 필요"}
                  </h3>
                  <div className="mt-3 space-y-1.5 text-sm text-slate-600">
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
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
