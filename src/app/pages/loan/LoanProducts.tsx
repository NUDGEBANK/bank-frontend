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
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full border-2 border-white/30 bg-white/20 p-3 shadow-lg backdrop-blur-md">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              대출상품을 비교하고 바로 신청해보세요
            </h1>
          </div>
          <p className="ml-16 text-xl text-blue-100 drop-shadow-lg">
            메인 상품 2개를 우선 비교하고, 신청 후에는 내 대출 관리에서 진행 상태를 확인할 수 있습니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {primaryProducts.map((product) => {
            const application = getApplication(product.id);

            return (
              <section
                key={product.id}
                className="rounded-3xl border-2 border-white/30 bg-white/15 p-8 shadow-2xl backdrop-blur-lg"
              >
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{product.name}</h2>
                  {product.badge && (
                    <span className="rounded-full border border-white/30 bg-blue-500/30 px-4 py-1 text-sm font-semibold text-white shadow-md backdrop-blur-sm">
                      {product.badge}
                    </span>
                  )}
                  {application && (
                    <span className="rounded-full border border-emerald-600/70 bg-emerald-600 px-4 py-1 text-sm font-semibold text-white shadow-sm">
                      접수 완료
                    </span>
                  )}
                </div>

                <p className="mb-6 text-sm leading-6 text-blue-100">{product.summary}</p>

                <div className="mb-6 text-4xl font-bold text-blue-300">{product.rate}</div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-sm text-blue-200">대출 한도</p>
                    <p className="font-bold text-white">{product.limit}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-blue-200">상환 기간</p>
                    <p className="font-bold text-white">{product.period}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-blue-200">대상</p>
                    <p className="font-bold text-white">{product.target}</p>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {product.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    to={`/loan/products/${product.id}`}
                    className="flex-1 rounded-xl border border-white/30 bg-white/10 py-4 text-center font-bold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    상세 보기
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleApply(product)}
                    className="flex-1 rounded-xl border border-white/30 bg-blue-500/30 py-4 font-bold text-white shadow-md backdrop-blur-sm transition-all hover:bg-blue-500/40"
                  >
                    {application ? "내 대출 관리 보기" : "대출 신청하기"}
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {secondaryProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-3xl border-2 border-white/30 bg-white/15 p-6 shadow-2xl backdrop-blur-lg"
            >
              <h3 className="mb-4 text-xl font-bold text-white">{product.name}</h3>
              <div className="mb-2 text-3xl font-bold text-blue-300">{product.rate}</div>
              <p className="mb-4 text-sm text-blue-100">{product.limit}</p>
              <div className="mb-6 space-y-2">
                {product.features.map((feature) => (
                  <p key={feature} className="text-sm text-blue-200">
                    {feature}
                  </p>
                ))}
              </div>
              <Link
                to={`/loan/products/${product.id}`}
                className="block w-full rounded-xl border border-white/30 bg-white/10 py-3 text-center font-bold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/20"
              >
                상세 보기
              </Link>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-blue-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">다시 둘러보기</span>
          </button>

          <div className="flex gap-6 text-sm text-blue-100">
            <a href="#" className="transition-colors hover:text-white">
              이용약관
            </a>
            <a href="#" className="transition-colors hover:text-white">
              개인정보처리방침
            </a>
            <a href="#" className="transition-colors hover:text-white">
              상품공시실
            </a>
            <a href="#" className="transition-colors hover:text-white">
              고객센터
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
