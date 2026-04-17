import { ArrowRight, ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getJson } from "../../lib/api";
import { checkAuthentication } from "../../lib/auth";

type LoanDetailItem = {
  name: string;
  description: string;
  badge: string;
  heroStyle: { bg: string; accent: string; ring: string };
  features: string[];
  target: string;
  limit: string;
  period: string;
  rate: string;
  rateDisplay: { prefix: string; main: string; sep?: string; sub?: string; suffix: string; extra?: string };
  caution: string[];
  guide: string[];
  terms: string[];
};

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

type DetailTab = "guide" | "rate" | "terms" | "caution";

const loanDetails: Record<string, LoanDetailItem> = {
  "consumption-loan": {
    name: "넛지 대출",
    description:
      "소비 흐름과 월별 지출 패턴을 기준으로 자금 운용 부담을 조절할 수 있도록 설계한 상품입니다.",
    badge: "분석 기반",
    heroStyle: {
      bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700",
      accent: "bg-slate-500/20",
      ring: "border-slate-400/10",
    },
    features: [
      "소비 분석 기반 상담",
      "최대 1,000만원 한도",
      "자동이체 연계 가능",
      "중도상환수수료 없음",
    ],
    target: "소비 흐름 관리가 필요한 고객",
    limit: "최소 50만원 ~ 최대 1,000만원",
    period: "6개월 ~ 18개월",
    rate: "연 5% ~ 12%",
    rateDisplay: { prefix: "연", main: "5", sep: "~", sub: "12", suffix: "%" },
    guide: [
      "월별 소비 패턴을 기준으로 자금 운용 부담을 조절할 수 있도록 설계했습니다.",
      "지출 흐름을 함께 관리하는 상품으로 생활비 목적 자금에 적합합니다.",
      "신청 후 심사 상태는 내 대출 관리에서 확인할 수 있습니다.",
    ],
    terms: [
      "대출금은 약정한 목적과 범위 내에서 사용해야 합니다.",
      "상환 계좌와 일정은 심사 완료 후 확정됩니다.",
      "상품 설명서와 약관 확인 후 신청해 주세요.",
    ],
    caution: [
      "개인의 신용도와 거래 조건에 따라 한도와 금리가 달라질 수 있습니다.",
      "연체 발생 시 약정 금리에 연체이자가 가산될 수 있습니다.",
      "과도한 대출은 상환 부담을 높일 수 있습니다.",
    ],
  },
  "youth-loan": {
    name: "자기계발 대출",
    description:
      "20대 청년이 자격증, 어학, 직무 교육 등 자기계발에 필요한 비용을 준비할 수 있도록 설계한 상품입니다.",
    badge: "청년 특화",
    heroStyle: {
      bg: "bg-gradient-to-br from-[#1e3a5f] via-[#2a4b78] to-[#3d6a9e]",
      accent: "bg-sky-400/15",
      ring: "border-sky-300/10",
    },
    features: [
      "자격증, 어학, 실무 교육 비용 지원",
      "최대 500만원 한도",
      "최대 24개월 상환",
      "신청 후 내 대출 관리에서 OCR 서류 제출",
    ],
    target: "만 19세 ~ 29세 청년 고객",
    limit: "최소 50만원 ~ 최대 500만원",
    period: "12개월 ~ 24개월",
    rate: "연 5.5% 시작 (우대 적용 시 최저 3.5%)",
    rateDisplay: { prefix: "연", main: "5.5", suffix: "%", extra: "우대 시 3.5%" },
    guide: [
      "자격증, 어학, 실무 교육 등 자기계발 목적에 맞는 자금을 지원합니다.",
      "대출 신청 후 내 대출 관리에서 서류를 제출하면 심사가 이어집니다.",
      "OCR 인증 결과에 따라 추가 확인 절차가 진행될 수 있습니다.",
    ],
    terms: [
      "자기계발 목적을 증빙할 수 있는 서류 제출이 필요합니다.",
      "상품 설명서와 약관을 확인한 뒤 신청해 주세요.",
      "심사 결과에 따라 최종 승인 여부와 한도는 달라질 수 있습니다.",
    ],
    caution: [
      "대출 신청 후 자기계발 증빙 서류를 제출해야 심사가 진행됩니다.",
      "서류 제출 및 OCR 인증 결과에 따라 추가 확인이 필요할 수 있습니다.",
      "개인의 신용도와 심사 결과에 따라 최종 승인 여부가 달라질 수 있습니다.",
    ],
  },
};

const tabs: { id: DetailTab; label: string }[] = [
  { id: "guide", label: "상품 안내" },
  { id: "rate", label: "금리 안내" },
  { id: "terms", label: "약관 및 설명서" },
  { id: "caution", label: "유의사항" },
];

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

export default function LoanDetail() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const product = productId ? loanDetails[productId] : undefined;
  const [applications, setApplications] = useState<LoanApplicationSummary[]>([]);
  const [completedLoans, setCompletedLoans] = useState<CompletedLoanHistory[]>([]);
  const [activeTab, setActiveTab] = useState<DetailTab>("guide");

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

  const latestApplication = useMemo(
    () => applications.find((item) => item.productKey === productId) ?? null,
    [applications, productId],
  );
  const latestCompletedLoan = useMemo(
    () => completedLoans.find((item) => item.productKey === productId) ?? null,
    [completedLoans, productId],
  );
  const isInUse =
    !!latestApplication &&
    (!latestCompletedLoan || latestApplication.appliedAt.slice(0, 10) >= latestCompletedLoan.completedAt);

  const handlePrimaryAction = () => {
    if (!productId || !product) {
      navigate("/loan/products");
      return;
    }

    if (isInUse) {
      navigate("/loan/management");
      return;
    }

    navigate(`/loan/products/${productId}/apply`);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">상품을 찾을 수 없습니다</h1>
          <Link to="/loan/products" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            대출 상품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const rd = product.rateDisplay;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 메인 콘텐츠 */}
      <div className="mx-auto max-w-6xl px-6 pt-10">
        {/* 네비게이션 */}
        <Link
          to="/loan/products"
          className="mb-8 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600"
        >
          <ChevronLeft className="h-4 w-4" />
          대출 상품 목록
        </Link>

        {/* 상품 정보 카드 */}
        <div className="rounded-2xl bg-white px-6 pb-6 pt-7 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          {/* 뱃지 */}
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {product.badge}
            </span>
            {latestApplication && isInUse && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(latestApplication.applicationStatus)}`}>
                {getApplicationStatusLabel(latestApplication)}
              </span>
            )}
          </div>

          {/* 상품명 & 설명 */}
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {product.description}
          </p>

          {/* 금리 */}
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-500">{rd.prefix}</span>
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">{rd.main}</span>
            {rd.sep && (
              <>
                <span className="mx-0.5 text-xl font-medium text-slate-500">{rd.sep}</span>
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">{rd.sub}</span>
              </>
            )}
            <span className="text-lg font-bold text-slate-500">{rd.suffix}</span>
            {rd.extra && (
              <span className="ml-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-500">
                {rd.extra}
              </span>
            )}
          </div>

          {/* 요약 정보 */}
          <div className="mt-6 flex border-t border-slate-100 pt-5">
            <div className="flex-1 border-r border-slate-100 pr-5">
              <span className="text-xs text-slate-400">대상</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">{product.target}</p>
            </div>
            <div className="flex-1 border-r border-slate-100 px-5">
              <span className="text-xs text-slate-400">한도</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">{product.limit}</p>
            </div>
            <div className="flex-1 pl-5">
              <span className="text-xs text-slate-400">기간</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">{product.period}</p>
            </div>
          </div>

          {/* 특징 */}
          <div className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="mb-3 text-sm font-bold text-slate-900">상품 특징</h3>
            <div className="flex flex-wrap gap-2">
              {product.features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-5 rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
          <p className="mb-1 text-center text-base font-bold text-slate-800">
            상품 내용을 확인한 뒤 바로 신청할 수 있습니다
          </p>
          <p className="mb-5 text-center text-xs text-slate-400">
            {productId === "youth-loan"
              ? "신청 후 내 대출 관리에서 OCR 서류를 제출하면 심사가 이어집니다."
              : productId === "consumption-loan"
                ? "신청 후 심사 상태를 내 대출 관리에서 바로 확인할 수 있습니다."
                : "신청 후 심사 상태와 상환 일정을 내 대출 관리에서 확인할 수 있습니다."}
          </p>
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-black py-3.5 text-sm font-semibold transition-colors hover:bg-gray-800"
            style={{ color: "#ffffff" }}
          >
            {isInUse ? "내 대출 관리" : "신청하기"}
            <ArrowRight className="h-4 w-4" style={{ color: "#ffffff" }} />
          </button>
        </div>

        {/* 탭 영역 */}
        <div className="mt-5 mb-14 overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
          {/* 탭 헤더 */}
          <div className="flex border-b border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  activeTab === tab.id
                    ? "border-b-2 border-slate-900 px-5 py-3.5 text-sm font-semibold text-slate-900"
                    : "px-5 py-3.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="px-6 py-6">
            {activeTab === "guide" && (
              <ul className="space-y-3">
                {product.guide.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {activeTab === "rate" && (
              <div>
                <div className="rounded-xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">적용 금리</span>
                    <span className="text-lg font-bold text-slate-900">{product.rate}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    실제 적용 금리는 신용도, 심사 결과, 거래 조건에 따라 달라질 수 있습니다.
                  </p>
                </div>
                {productId === "youth-loan" && (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-5">
                    <p className="mb-3 text-sm font-semibold text-emerald-700">자기계발 대출 상환 기준</p>
                    <ul className="space-y-2 text-xs leading-relaxed text-slate-600">
                      <li>매달 이자를 납부하고 만기 회차에 원금을 일괄 상환합니다.</li>
                      <li>가상계좌 번호를 확인해 수동 상환으로 직접 납부합니다.</li>
                      <li>연체 시 약정 금리에 3.0%p가 가산되며 최대 연 15.0%까지 적용됩니다.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "terms" && (
              <ul className="space-y-3">
                {product.terms.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {activeTab === "caution" && (
              <div className="rounded-xl bg-amber-50 p-5">
                <ul className="space-y-2.5">
                  {product.caution.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
