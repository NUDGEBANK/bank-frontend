import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getJson } from "../../lib/api";
import { checkAuthentication } from "../../lib/auth";
import loanConsumptionImg from "../../../assets/loan-consumption.png";
import loanYouthImg from "../../../assets/loan-youth.png";

type LoanApplicationSummary = {
  loanApplicationId: number;
  productKey: string;
  productName: string;
  applicationStatus: string;
  appliedAt: string;
  requiresCertificateSubmission: boolean;
  certificateSubmitted: boolean;
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
      return "접수 완료";
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-500 text-white";
    case "REJECTED":
      return "bg-red-500 text-white";
    case "DOCUMENT_REQUIRED":
      return "bg-amber-500 text-white";
    default:
      return "bg-sky-500 text-white";
  }
}

export default function LoanProducts() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LoanApplicationSummary[]>([]);
  const [completedLoans, setCompletedLoans] = useState<CompletedLoanHistory[]>([]);

  useEffect(() => {
    const syncApplications = async () => {
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
        setApplications(nextApplications);
        setCompletedLoans(nextCompletedLoans);
      } catch {
        setApplications([]);
        setCompletedLoans([]);
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

  const getLatestApplication = (productId: string) =>
    applications.find((a) => a.productKey === productId) ?? null;

  const getLatestCompletedLoan = (productId: string) =>
    completedLoans.find((l) => l.productKey === productId) ?? null;

  const isProductInUse = (productId: string) => {
    const latestApp = getLatestApplication(productId);
    const latestCompleted = getLatestCompletedLoan(productId);
    if (!latestApp) return false;
    if (!latestCompleted) return true;
    return latestApp.appliedAt.slice(0, 10) >= latestCompleted.completedAt;
  };

  const handleApply = (productId: string) => {
    if (isProductInUse(productId)) {
      navigate("/loan/management");
      return;
    }
    navigate(`/loan/products/${productId}/apply`);
  };

  const consumptionApp = getLatestApplication("consumption-loan");
  const consumptionInUse = isProductInUse("consumption-loan");
  const youthApp = getLatestApplication("youth-loan");
  const youthInUse = isProductInUse("youth-loan");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-slate-800">대출 상품</h1>
        <p className="mt-2 text-sm text-slate-400">
          나에게 맞는 상품을 비교하고 신청해보세요
        </p>
      </div>

      {/* 카드 영역 */}
      <div className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* ── 소비분석 대출 ── */}
          <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            {/* 이미지 */}
            <div className="relative h-56 overflow-hidden">
              <img
                src={loanConsumptionImg}
                alt="소비분석 대출"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* 이미지 위 뱃지 */}
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-[#2a4b78] shadow-sm backdrop-blur-sm">
                  분석 기반
                </span>
                {consumptionApp && consumptionInUse && (
                  <span className={`rounded-full px-3.5 py-1 text-xs font-semibold shadow-sm ${getStatusStyle(consumptionApp.applicationStatus)}`}>
                    {getApplicationStatusLabel(consumptionApp)}
                  </span>
                )}
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
              <h2 className="mb-1 text-xl font-bold text-slate-900">소비분석 대출</h2>
              <p className="mb-4 text-sm text-slate-400">
                소비 패턴을 분석하여 맞춤 금리를 제공합니다
              </p>

              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-500">연</span>
                <span className="text-3xl font-extrabold text-slate-900">4.2</span>
                <span className="text-lg text-slate-300">~</span>
                <span className="text-3xl font-extrabold text-slate-900">8.9</span>
                <span className="text-lg font-bold text-slate-500">%</span>
              </div>

              <div className="mb-5 flex gap-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
                <div>
                  <span className="text-xs text-slate-500">한도</span>
                  <p className="font-semibold text-slate-700">최대 1,000만원</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">기간</span>
                  <p className="font-semibold text-slate-700">6~18개월</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">대상</span>
                  <p className="font-semibold text-slate-700">소비 흐름 관리 고객</p>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleApply("consumption-loan")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-black py-3.5 text-sm font-semibold transition-colors hover:bg-gray-800"
                  style={{ color: "#ffffff" }}
                >
                  {consumptionInUse ? "내 대출 관리" : "신청하기"}
                  <ArrowRight className="h-4 w-4" style={{ color: "#ffffff" }} />
                </button>
                <Link
                  to="/loan/products/consumption-loan"
                  className="w-full rounded-full border border-slate-200 py-3 text-center text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
                >
                  상세 보기
                </Link>
              </div>
            </div>
          </div>

          {/* ── 자기계발 대출 ── */}
          <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            {/* 이미지 */}
            <div className="relative h-56 overflow-hidden">
              <img
                src={loanYouthImg}
                alt="자기계발 대출"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* 이미지 위 뱃지 */}
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-[#2a4b78] shadow-sm backdrop-blur-sm">
                  청년 특화
                </span>
                {youthApp && youthInUse && (
                  <span className={`rounded-full px-3.5 py-1 text-xs font-semibold shadow-sm ${getStatusStyle(youthApp.applicationStatus)}`}>
                    {getApplicationStatusLabel(youthApp)}
                  </span>
                )}
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
              <h2 className="mb-1 text-xl font-bold text-slate-900">자기계발 대출</h2>
              <p className="mb-4 text-sm text-slate-400">
                자격증, 어학, 직무 교육 비용을 지원합니다
              </p>

              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-500">연</span>
                <span className="text-3xl font-extrabold text-slate-900">5.5</span>
                <span className="text-lg font-bold text-slate-500">%</span>
                <span className="ml-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-500">
                  우대 시 3.5%
                </span>
              </div>

              <div className="mb-5 flex gap-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
                <div>
                  <span className="text-xs text-slate-500">한도</span>
                  <p className="font-semibold text-slate-700">최대 500만원</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">기간</span>
                  <p className="font-semibold text-slate-700">12~24개월</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">대상</span>
                  <p className="font-semibold text-slate-700">만 19~29세 청년</p>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleApply("youth-loan")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-black py-3.5 text-sm font-semibold transition-colors hover:bg-gray-800"
                  style={{ color: "#ffffff" }}
                >
                  {youthInUse ? "내 대출 관리" : "신청하기"}
                  <ArrowRight className="h-4 w-4" style={{ color: "#ffffff" }} />
                </button>
                <Link
                  to="/loan/products/youth-loan"
                  className="w-full rounded-full border border-slate-200 py-3 text-center text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
                >
                  상세 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
