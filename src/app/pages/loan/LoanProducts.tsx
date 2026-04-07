import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getJson } from "../../lib/api";

type LoanProduct = {
  id: string;
  name: string;
  badge?: string;
  rate: string;
  limit: string;
  period: string;
  target: string;
  summary: string;
  features: string[];
  isPrimary: boolean;
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
      return "접수 완료";
  }
}

const loanProducts: LoanProduct[] = [
  {
    id: "consumption-loan",
    name: "소비분석 대출",
    badge: "분석 기반",
    rate: "연 4.2% ~ 8.9%",
    limit: "최대 300만원",
    period: "6개월 ~ 18개월",
    target: "소비 흐름 관리가 필요한 고객",
    summary:
      "소비 패턴을 바탕으로 자금 운용 부담을 조절할 수 있도록 설계한 상품입니다.",
    features: ["소비 흐름 점검", "간편 심사", "자동이체 연계"],
    isPrimary: true,
  },
  {
    id: "youth-loan",
    name: "자기계발 대출",
    badge: "청년 특화",
    rate: "연 3.8% ~ 6.2%",
    limit: "최대 500만원",
    period: "12개월 ~ 24개월",
    target: "만 19세 ~ 29세 청년",
    summary:
      "자격증, 어학, 직무 교육 등 자기계발 비용을 준비할 수 있도록 지원하는 상품입니다.",
    features: ["서류 제출형 심사", "중도상환수수료 없음", "OCR 연계"],
    isPrimary: true,
  },
  {
    id: "situate-loan",
    name: "비상금 대출",
    rate: "연 5.1% ~ 9.9%",
    limit: "최대 200만원",
    period: "1개월 ~ 12개월",
    target: "소액 단기 자금 필요 고객",
    summary: "짧은 기간이지만 빠르게 대응해야 하는 상황을 위한 소액 상품입니다.",
    features: ["소액 한도", "빠른 실행", "모바일 신청"],
    isPrimary: false,
  },
];

export default function LoanProducts() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LoanApplicationSummary[]>([]);

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

  const primaryProducts = useMemo(
    () => loanProducts.filter((product) => product.isPrimary),
    [],
  );
  const secondaryProducts = useMemo(
    () => loanProducts.filter((product) => !product.isPrimary),
    [],
  );

  const getApplication = (productId: string) =>
    applications.find((application) => application.productKey === productId) ?? null;

  const handleApply = (product: LoanProduct) => {
    const existing = getApplication(product.id);
    if (existing) {
      navigate("/loan/management");
      return;
    }

    navigate(`/loan/products/${product.id}/apply`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full border border-blue-100 bg-blue-50 p-3 shadow-sm">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              대출상품을 비교하고 바로 신청해보세요
            </h1>
          </div>
          <p className="ml-16 text-xl text-slate-500">
            메인 상품 2개를 우선 비교하고, 신청 후에는 내 대출 관리에서 진행 상태를 확인할 수 있습니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {primaryProducts.map((product) => {
            const application = getApplication(product.id);

            return (
              <section
                key={product.id}
                className="flex h-full flex-col rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
              >
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
                  {product.badge && (
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700">
                      {product.badge}
                    </span>
                  )}
                  {application && (
                    <span className="rounded-full border border-emerald-600/70 bg-emerald-600 px-4 py-1 text-sm font-semibold text-white shadow-sm">
                      {getApplicationStatusLabel(application)}
                    </span>
                  )}
                </div>

                <p className="mb-6 min-h-[48px] text-sm leading-6 text-slate-500">{product.summary}</p>

                <div className="mb-6 text-4xl font-bold text-slate-900">{product.rate}</div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
                  <div className="min-h-[72px]">
                    <p className="mb-1 text-sm text-slate-400">대출 한도</p>
                    <p className="font-bold text-slate-900">{product.limit}</p>
                  </div>
                  <div className="min-h-[72px]">
                    <p className="mb-1 text-sm text-slate-400">상환 기간</p>
                    <p className="font-bold text-slate-900">{product.period}</p>
                  </div>
                  <div className="min-h-[72px]">
                    <p className="mb-1 text-sm text-slate-400">대상</p>
                    <p className="font-bold text-slate-900">{product.target}</p>
                  </div>
                </div>

                <div className="mb-6 flex min-h-[52px] flex-wrap content-start gap-2">
                  {product.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex flex-col gap-4 sm:flex-row">
                  <Link
                    to={`/loan/products/${product.id}`}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-center font-bold text-slate-700 transition-all hover:bg-slate-50"
                  >
                    상세 보기
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleApply(product)}
                    className="flex-1 rounded-2xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800"
                  >
                    {application ? "내 대출 관리 보기" : "대출 신청하기"}
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {secondaryProducts.map((product) => {
            const application = getApplication(product.id);

            return (
            <div
              key={product.id}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                {application && (
                  <span className="rounded-full border border-emerald-600/70 bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    {getApplicationStatusLabel(application)}
                  </span>
                )}
              </div>
              <div className="mb-2 text-3xl font-bold text-slate-900">{product.rate}</div>
              <p className="mb-4 text-sm text-slate-500">{product.limit}</p>
              <div className="mb-6 space-y-2">
                {product.features.map((feature) => (
                  <p key={feature} className="text-sm text-slate-500">
                    {feature}
                  </p>
                ))}
              </div>
              <Link
                to={`/loan/products/${product.id}`}
                className="block w-full rounded-2xl border border-slate-200 bg-white py-3 text-center font-bold text-slate-700 transition-all hover:bg-slate-50"
              >
                상세 보기
              </Link>
              <button
                type="button"
                onClick={() => handleApply(product)}
                className="mt-3 block w-full rounded-2xl bg-slate-900 py-3 text-center font-bold text-white transition-all hover:bg-slate-800"
              >
                {application ? "내 대출 관리 보기" : "대출 신청하기"}
              </button>
            </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">다시 둘러보기</span>
          </button>

          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="transition-colors hover:text-slate-900">
              이용약관
            </a>
            <a href="#" className="transition-colors hover:text-slate-900">
              개인정보처리방침
            </a>
            <a href="#" className="transition-colors hover:text-slate-900">
              상품공시실
            </a>
            <a href="#" className="transition-colors hover:text-slate-900">
              고객센터
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
