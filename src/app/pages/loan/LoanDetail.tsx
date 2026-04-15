import {
  AlertCircle,
  Calendar,
  Coins,
  FileText,
  Info,
  Percent,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getJson } from "../../lib/api";
import { checkAuthentication } from "../../lib/auth";

type LoanDetailItem = {
  name: string;
  description: string;
  features: string[];
  target: string;
  limit: string;
  period: string;
  rate: string;
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
    name: "소비분석 대출",
    description:
      "소비 흐름과 월별 지출 패턴을 기준으로 자금 운용 부담을 조절할 수 있도록 설계한 상품입니다.",
    features: [
      "소비 분석 기반 상담",
      "최대 300만원 한도",
      "자동이체 연계 가능",
      "중도상환수수료 없음",
    ],
    target: "소비 흐름 관리가 필요한 고객",
    limit: "최소 50만원 ~ 최대 300만원",
    period: "6개월 ~ 18개월",
    rate: "연 4.2% ~ 8.9%",
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
  "situate-loan": {
    name: "비상금 대출",
    description:
      "갑작스러운 지출에 빠르게 대응할 수 있도록 소액 한도를 제공하는 단기 자금 상품입니다.",
    features: ["최대 200만원", "단기 자금 대응", "모바일 신청", "빠른 실행"],
    target: "소액 단기 자금이 필요한 고객",
    limit: "최소 30만원 ~ 최대 200만원",
    period: "1개월 ~ 12개월",
    rate: "연 5.1% ~ 9.9%",
    guide: [
      "갑작스러운 생활비와 긴급 자금 수요에 대응하기 위한 상품입니다.",
      "짧은 기간 안에 빠르게 실행할 수 있도록 단순한 구조로 설계했습니다.",
      "모바일 신청 후 상태를 바로 확인할 수 있습니다.",
    ],
    terms: [
      "실행 한도와 금리는 심사 결과에 따라 달라질 수 있습니다.",
      "상환 일정과 계좌는 승인 후 확정됩니다.",
      "약정 전 상품 설명서와 약관을 반드시 확인해 주세요.",
    ],
    caution: [
      "필요 이상으로 반복 사용하면 상환 부담이 커질 수 있습니다.",
      "연체 시 개인 신용점수에 부정적인 영향이 발생할 수 있습니다.",
      "약정 전 상품 설명서와 유의사항을 반드시 확인해 주세요.",
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
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-lg border border-white/20 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-md">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">상품을 찾을 수 없습니다</h1>
          <Link to="/loan/products" className="font-semibold text-blue-600 hover:underline">
            대출 상품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <Link
          to="/loan/products"
          className="mb-4 inline-block font-semibold text-blue-300 transition-colors hover:text-white"
        >
          ← 대출 상품 목록
        </Link>
        <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg">{product.name}</h1>
        <p className="text-xl text-blue-100 drop-shadow-md">{product.description}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded bg-blue-100 p-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">특징</h3>
          </div>
          <p className="text-sm text-gray-600">{product.features.length}가지 핵심 조건</p>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">대상</h3>
          </div>
          <p className="text-sm text-gray-600">{product.target}</p>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded bg-blue-100 p-2">
              <Coins className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">한도</h3>
          </div>
          <p className="text-sm text-gray-600">{product.limit}</p>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded bg-blue-100 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">기간</h3>
          </div>
          <p className="text-sm text-gray-600">{product.period}</p>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-[#d7e5f5] bg-[linear-gradient(135deg,_#edf4fb_0%,_#dfeefb_50%,_#f8fbff_100%)] p-8 text-center text-slate-900 shadow-xl">
        <h3 className="mb-2 text-2xl font-bold">상품 내용을 확인한 뒤 바로 신청할 수 있습니다</h3>
        {latestApplication && isInUse && (
          <div className="mb-4 inline-flex rounded-full border border-emerald-600/70 bg-emerald-600 px-4 py-1 text-sm font-semibold text-white shadow-sm">
            {getApplicationStatusLabel(latestApplication)}
          </div>
        )}
        <p className="mb-6 text-slate-600">
          {productId === "youth-loan"
            ? "자기계발 대출은 신청 후 내 대출 관리에서 OCR 서류를 제출하면 심사가 이어집니다."
            : productId === "consumption-loan"
              ? "소비분석 대출은 신청 후 심사 상태를 내 대출 관리에서 바로 확인할 수 있습니다."
              : "비상금 대출은 신청 후 심사 상태와 상환 일정을 내 대출 관리에서 확인할 수 있습니다."}
        </p>
        <button
          type="button"
          onClick={handlePrimaryAction}
          className="rounded-xl bg-[#6d8ca6] px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-[#5c7c97]"
        >
          {isInUse ? "내 대출 관리 보기" : "대출 신청하기"}
        </button>
      </div>

      <div className="rounded-lg border border-white/20 bg-white/95 shadow-2xl backdrop-blur-md">
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 px-6 py-4 font-semibold text-blue-600"
                    : "px-6 py-4 font-semibold text-gray-500 hover:text-gray-700"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {activeTab === "guide" && (
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                <Info className="h-5 w-5 text-blue-600" />
                상품 특징
              </h3>
              <ul className="space-y-3">
                {product.guide.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === "rate" && (
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                <Percent className="h-5 w-5 text-blue-600" />
                금리 정보
              </h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-gray-700">적용 금리</span>
                  <span className="text-xl font-bold text-gray-900">{product.rate}</span>
                </div>
                <p className="text-sm text-gray-600">
                  실제 적용 금리는 신용도, 심사 결과, 거래 조건에 따라 달라질 수 있습니다.
                </p>
              </div>
              {productId === "youth-loan" && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/80 p-6 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-emerald-700">자기계발 대출 상환 기준</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    <li>매달 이자를 납부하고 만기 회차에 원금을 일괄 상환합니다.</li>
                    <li>가상계좌 번호를 확인해 수동 상환으로 직접 납부합니다.</li>
                    <li>연체 시 약정 금리에 3.0%p가 가산되며 최대 연 15.0%까지 적용됩니다.</li>
                  </ul>
                </div>
              )}
            </section>
          )}

          {activeTab === "terms" && (
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                <FileText className="h-5 w-5 text-blue-600" />
                약관 및 설명서
              </h3>
              <ul className="space-y-3">
                {product.terms.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === "caution" && (
            <section>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                <FileText className="h-5 w-5 text-blue-600" />
                유의사항
              </h3>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50/80 p-6 backdrop-blur-sm">
                <ul className="space-y-2 text-sm text-gray-700">
                  {product.caution.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
